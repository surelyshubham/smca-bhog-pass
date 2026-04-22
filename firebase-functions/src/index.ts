import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * Bulk Coupon Generation Cloud Function
 * Triggered automatically when a new Event is created.
 * Parses the 'members' collection and provisions unique 'coupons' for every family member.
 */
export const bulkGenerateCouponsOnEventCreate = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snap, context) => {
    const eventId = context.params.eventId;
    
    // Fetch all primary members
    const membersSnapshot = await db.collection('members').get();
    if (membersSnapshot.empty) {
      console.log('No members found. Generation skipped.');
      return;
    }

    const batch = db.batch();
    let count = 0;

    for (const doc of membersSnapshot.docs) {
      const memberData = doc.data();
      const familySize = memberData.familyCount || 1;
      
      // We create a separate coupon document for each family member
      const namesToIssue: string[] = [];
      
      // Primary Member
      if (memberData.name) namesToIssue.push(memberData.name);
      
      // Spouse
      if (memberData.spouseName) namesToIssue.push(memberData.spouseName);
      
      // Children
      if (Array.isArray(memberData.childrenNames)) {
        namesToIssue.push(...memberData.childrenNames);
      }
      
      // In case we don't have explicit names for all 'familyCount', fallback to "XXX's Family Member"
      while (namesToIssue.length < familySize) {
         namesToIssue.push(`${memberData.name || 'Member'}'s Family Member`);
      }

      // Generate a coupon doc for each person
      for (const personName of namesToIssue) {
         const newCouponRef = db.collection('coupons').doc();
         batch.set(newCouponRef, {
           eventId: eventId,
           memberId: doc.id,
           holderName: personName,
           status: 'issued', // Only allowed to scan 'issued' coupons
           source: 'member'
         });
         count++;
      }
      
      // Firestore batches support up to 500 operations
      // If we approach 500, we should commit and open a new batch.
      if (count >= 450) {
        await batch.commit();
        count = 0;
        // Re-initialize a blank batch if necessary logic was here
      }
    }
    
    if (count > 0) {
      await batch.commit();
    }
    
    console.log(`Successfully generated coupons for event ${eventId}. Total passes: ${count}`);
    
    // AI Personalization placeholder 
    // Usually implemented via Firebase Genkit or direct GenAI call inside the function map
    /*
      const personalizedGreeting = await generateGreetingWithGenkit({
         prompt: `Write a Jai Shree Krishna greeting for ${primaryMember.name}...`
      });
      await sendEmailWithQRCode(primaryMember.email, personalizedGreeting, qrLinks);
    */
  });
