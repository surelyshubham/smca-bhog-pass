"use client";

import { useAuth } from "@/components/AuthProvider";
import { ScannerComponent } from "@/components/ScannerComponent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ScannerPage() {
  const { user, roleData } = useAuth();
  const [guestName, setGuestName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receptionist must select the active event implicitly. We will fetch the active event.
  const createGuestPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setIsSubmitting(true);
    try {
      // Find active event
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, where("isActive", "==", true));
      const activeEvents = await getDocs(q);

      if (activeEvents.empty) {
         toast.error("No active event found. Connect with Admin.");
         setIsSubmitting(false);
         return;
      }

      const activeEventId = activeEvents.docs[0].id;

      const couponData = {
        eventId: activeEventId,
        holderName: guestName.trim() + " (Guest)",
        status: "issued",
        source: "guest"
      };

      await addDoc(collection(db, "coupons"), couponData);
      toast.success(`Guest pass created for ${guestName}`);
      setGuestName("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create guest pass");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!roleData || (roleData.role !== "admin" && roleData.role !== "receptionist")) {
    return <div className="p-4 text-center text-zinc-500">Access Denied.</div>;
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-6">Entry Manager</h1>
      
      <Tabs defaultValue="scan" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scan">QR Scanner</TabsTrigger>
          <TabsTrigger value="guest">Guest Pass</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scan" className="mt-6">
          <ScannerComponent />
          <p className="text-center text-sm text-zinc-500 font-medium mt-4 bg-zinc-100 py-2 rounded-md">
            Scanner is highly optimized. Aim at QR.
          </p>
        </TabsContent>
        
        <TabsContent value="guest" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Instant Guest Pass</CardTitle>
              <CardDescription>Issue an on-the-spot pass for sudden guests.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createGuestPass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName">Guest Full Name</Label>
                  <Input 
                    id="guestName" 
                    placeholder="E.g. Rahul Sharma" 
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Issue Guest Pass
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
