"use client";

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
import { Loader2, Plus, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Event } from "@/lib/types";

export default function AdminPage() {
  const { user, roleData } = useAuth();
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [events, setEvents] = useState<(Event & { id: string })[]>([]);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
       const q = query(collection(db, "events"));
       const snapshot = await getDocs(q);
       const evts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as (Event & {id: string})));
       setEvents(evts);
    } catch(err) {
      console.error(err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsCreatingEvent(true);
    
    try {
      const newEvent: Event = {
        name: eventName,
        date: eventDate,
        isActive: true,
        createdBy: user.uid,
      };
      
      const docRef = await addDoc(collection(db, "events"), newEvent);
      toast.success("Event created successfully.");
      
      // Simulate calling the Cloud Function
      toast.info("Triggered bulk coupon generation in background...");
      
      setEventName("");
      setEventDate("");
      loadEvents();
    } catch(err: any) {
      toast.error(err.message || "Failed to create event");
    } finally {
       setIsCreatingEvent(false);
    }
  };

  // Mocking Members Import
  const handleImportMembers = async () => {
     // Usually parses an Excel sheet. Here we will just add dummy members for testing
     if (!user) return;
     toast.info("Importing members...");
     try {
       const membersCollection = collection(db, "members");
       // Add a dummy member
       await addDoc(membersCollection, {
         name: "Amit Patel",
         phone: "9876543210",
         familyCount: 3,
         spouseName: "Priya Patel",
         childrenNames: ["Rohan Patel"]
       });
       toast.success("Members imported successfully. Active event auto-generates coupons.");
     } catch (e: any) {
        toast.error(e.message);
     }
  };

  if (!roleData || roleData.role !== "admin") {
    return <div className="p-4 text-center text-zinc-500">Access Denied.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Admin Dashboard</h1>
           <p className="text-zinc-500 mt-1">Manage events, staff, and members.</p>
        </div>
      </div>

      <Tabs defaultValue="events" className="w-full mt-6">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="members">Members & Import</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events" className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Create Event</CardTitle>
                <CardDescription>Coupons are auto-generated via Cloud Functions when an event is created.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateEvent} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventName">Event Name</Label>
                    <Input 
                      id="eventName" 
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="e.g. Navratri Mahotsav 2026"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Event Date(s)</Label>
                    <Input 
                      id="eventDate" 
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      placeholder="Oct 10 - Oct 14, 2026"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isCreatingEvent}>
                    {isCreatingEvent ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create Event
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Recent Events</h2>
            {events.length === 0 ? (
               <div className="p-12 text-center border-2 border-dashed border-zinc-200 rounded-lg text-zinc-500 font-medium">
                 No events found. Create one.
               </div>
            ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {events.map((evt) => (
                    <Card key={evt.id} className="relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                      <CardHeader className="pl-6">
                        <CardTitle className="flex items-center justify-between">
                           {evt.name}
                           {evt.isActive && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Active</span>}
                        </CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Calendar className="w-4 h-4 mr-1 text-zinc-400" /> {evt.date}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                 ))}
               </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="members" className="mt-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Member Management</CardTitle>
              <CardDescription>Import the latest census of community members.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleImportMembers} variant="secondary" className="w-full">
                 Import Members (Demo)
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
