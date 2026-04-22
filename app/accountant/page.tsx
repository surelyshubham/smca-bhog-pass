"use client";

import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, IndianRupee } from "lucide-react";
import { Payment } from "@/lib/types";

export default function AccountantPage() {
  const { user, roleData } = useAuth();
  const [amount, setAmount] = useState("");
  const [memberName, setMemberName] = useState("");
  const [trustAccount, setTrustAccount] = useState<"Trust" | "SMCA">("SMCA");
  const [mode, setMode] = useState<"Cash" | "Card" | "Online">("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadRecent = async () => {
      try {
        const q = query(
          collection(db, "payments"), 
          where("collectorUid", "==", user.uid)
        );
        const snapshot = await getDocs(q);
        const payments = snapshot.docs.map(doc => doc.data() as Payment);
        // sort by timestamp client side if simple
        payments.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentPayments(payments.slice(0, 5));
      } catch(err) {
        console.error("Failed to fetch payments", err);
      }
    };
    loadRecent();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentData: Payment = {
        amount: Number(amount),
        trustAccount,
        mode,
        memberName: memberName.trim(),
        collectorUid: user.uid,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, "payments"), paymentData);
      toast.success("Payment recorded successfully.");
      setRecentPayments([paymentData, ...recentPayments].slice(0, 5));
      setAmount("");
      setMemberName("");
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!roleData || (roleData.role !== "admin" && roleData.role !== "accountant")) {
    return <div className="p-4 text-center text-zinc-500">Access Denied.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Donation Entry</h1>
        <Card className="shadow-sm border border-zinc-200">
          <CardHeader>
            <CardTitle>Record Payment</CardTitle>
            <CardDescription>Log a donation to Trust or SMCA account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="memberName">Member Name</Label>
                <Input 
                  id="memberName" 
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Rahul Sharma"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input 
                    id="amount" 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="2500"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Trust Account</Label>
                <Select value={trustAccount} onValueChange={(val: any) => setTrustAccount(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMCA">SMCA Account</SelectItem>
                    <SelectItem value="Trust">Trust Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={mode} onValueChange={(val: any) => setMode(val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card / POS</SelectItem>
                    <SelectItem value="Online">Online / UPI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Record Payment
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 mt-2 md:mt-0">Recent Entries</h2>
        <div className="space-y-3">
          {recentPayments.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-zinc-200 rounded-lg text-zinc-500 text-sm">
              No recent payments recorded by you.
            </div>
          ) : (
            recentPayments.map((p, i) => (
              <Card key={i} className="shadow-sm border border-zinc-200 rounded-lg overflow-hidden">
                <div className="p-4 flex items-center justify-between bg-white">
                  <div>
                    <h3 className="font-semibold text-zinc-900">{p.memberName}</h3>
                    <p className="text-xs text-zinc-500 mt-1">{new Date(p.timestamp).toLocaleTimeString()} • {p.mode}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg text-emerald-600 flex items-center justify-end">
                      <IndianRupee className="w-4 h-4 mr-0.5" />{p.amount.toLocaleString()}
                    </div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded mt-1">
                      {p.trustAccount}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
