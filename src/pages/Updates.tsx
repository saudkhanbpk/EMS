import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Check, CheckCheck, ChevronDown, Edit, Trash2 } from "lucide-react";
import { useUser } from "../contexts/UserContext";

interface Update {
  id: number;
  description: string;
  selected: boolean;
  created_at?: string;
}
const Loader = () => (
  <div className="flex flex-col items-center justify-center min-h-[200px] py-8">
    <svg className="animate-spin h-14 w-14 text-[#9A00FF]" viewBox="0 0 50 50">
      <circle
        className="opacity-20"
        cx="25"
        cy="25"
        r="20"
        stroke="#9A00FF"
        strokeWidth="6"
        fill="none"
      />
      <path
        className="opacity-80"
        fill="none"
        stroke="url(#gradient)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="65, 150"
        d="M25 5
             a 20 20 0 0 1 0 40
             a 20 20 0 0 1 0 -40"
      />
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9A00FF" />
          <stop offset="100%" stopColor="#5A00B4" />
        </linearGradient>
      </defs>
    </svg>
    <div className="pt-4 text-[#9A00FF] font-semibold text-lg animate-pulse">
      Loading Alerts...
    </div>
  </div>
);
function Updates() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [updateval, setupdateval] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const { userProfile } = useUser()
  const [emaillist, setemaillist] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setloading] = useState<boolean>(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!updateval.trim()) {
      setErrorMsg("Alert message cannot be empty");
      return;
    }

    try {
      if (editingId) {
        // Update existing record
        const { data, error } = await supabase
          .from("Updates")
          .update({ description: updateval, organization_id: userProfile?.organization_id })
          .eq("id", editingId)
          .select("*");

        if (error) throw error;

        console.log("Update successful:", data);
        setSubmitted(true);
        setEditingId(null);
      } else {
        // Create new record
        const { data, error } = await supabase
          .from("Updates")
          .insert([{ description: updateval, organization_id: userProfile?.organization_id }])
          .select("*");

        if (error) throw error;

        console.log("Update inserted:", data);
        setUpdates(prev => [...prev, data[0]]);
        await sendemail();
      }

      setSubmitted(true);
      setupdateval("");
      fetchupdates();
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Operation failed:", error);
      setErrorMsg("Failed to process your request");
    }
  }

  const sendemail = async () => {
    try {
      // 1. Fetch emails
      const { data, error } = await supabase
        .from("users")
        .select("personal_email")
        .eq("organization_id", userProfile?.organization_id);

      if (error) throw error;

      const emailList = data.map(user => user.personal_email);
      setemaillist(emailList);

      // 2. Send emails
      const response = await fetch("https://ems-server-0bvq.onrender.com/send-alertemail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: emailList,
          subject: "Message From EMS Alerts",
          message: `A New Message is added To Email Alerts "${updateval}"`,
        }),
      });

      if (!response.ok) throw new Error("Email sending failed");

      const result = await response.json();
      console.log("Email response:", result);
    } catch (err) {
      console.error("Email error:", err);
    }
  };

  async function fetchupdates() {
    setloading(true)
    try {
      const { data, error } = await supabase
        .from("Updates")
        .select("*")
        .order("created_at", { ascending: false })
        .eq("organization_id", userProfile?.organization_id);

      if (error) throw error;

      const sortedUpdates = [...data].sort((a, b) =>
        (b.selected === true ? 1 : 0) - (a.selected === true ? 1 : 0)
      );
      setUpdates(sortedUpdates);
    } catch (error) {
      console.error("Fetch error:", error);
    }
    setloading(false)
  }

  async function handledelete(id: number) {
    try {
      const { error } = await supabase
        .from("Updates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      fetchupdates();
    } catch (error) {
      console.error("Delete error:", error);
    }
  }

  async function handleselect(id: number) {
    try {
      // Clear any existing selection
      await supabase
        .from("Updates")
        .update({ selected: false })
        .eq("selected", true)
        .eq("organization_id", userProfile?.organization_id);

      // Set new selection
      const { error } = await supabase
        .from("Updates")
        .update({ selected: true })
        .eq("id", id);

      if (error) throw error;

      fetchupdates();
    } catch (error) {
      console.error("Selection error:", error);
    }
  }

  const handleEdit = (update: Update) => {
    setEditingId(update.id);
    setupdateval(update.description);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchupdates();
  }, []);

  return (
    <div>
      <h2 className="text-[28px] leading-9 text-[#000000] font-bold mb-4">
        Office Alerts
      </h2>
      <div className="p-6 bg-white rounded-[10px] shadow-lg mb-6">
        <h2 className="text-[22px] leading-7 text-[#000000] font-semibold mb-4">
          {editingId ? "Edit Alert" : "Briefly Describe the Office Alert"}
        </h2>
        <form onSubmit={handleSubmit}>
          <textarea
            value={updateval}
            rows={6}
            onChange={(e) => {
              setupdateval(e.target.value);
              setErrorMsg("");
            }}
            className="w-full border border-gray-300 rounded-[10px] p-2 mb-4 outline-none"
            placeholder="Write your Alert here..."
            required
          />
          {errorMsg && <p className="text-red-600 mb-2">{errorMsg}</p>}
          <div className="flex justify-end gap-4">
            <button
              type="submit"
              className="w-[179px] h-[45px] px-4 py-2 bg-[#9A00FF]  text-white rounded-[10px] hover:bg-[#6a2e92]"
            >
              {editingId ? "Update Alert" : "Submit Alert"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setupdateval("");
                }}
                className="w-[179px] h-[45px] px-4 py-2 bg-red-500 text-white rounded-[10px] hover:bg-red-700"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
        {submitted && (
          <p className="text-green-600 mt-4">
            {editingId ? "Alert updated successfully!" : "Alert submitted successfully!"}
          </p>
        )}

        <h1 className="text-2xl font-bold font-mono mt-8">All Office Alerts</h1>

        {loading ? <Loader /> : <div className="flex justify-center gap-4 mt-4 flex-wrap">
          {updates.length > 0 ? (
            updates.map((update) => (
              <div
                key={update.id}
                className={`max-w-sm w-full bg-white rounded-lg shadow-md overflow-hidden ${update.selected ? "border-2 border-blue-500" : ""
                  }`}
              >
                <div className="p-4 sm:p-6">
                  <div className="mb-4">
                    <p className="text-gray-700">{update.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(update.created_at || '').toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      onClick={() => handleselect(update.id)}
                      disabled={update.selected}
                      className={`flex items-center justify-center gap-2 ${update.selected
                        ? "bg-blue-600 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                        } text-white py-2 px-4 rounded-md transition-colors`}
                    >
                      {update.selected ? (
                        <>
                          <CheckCheck size={18} />
                          <span>Selected</span>
                        </>
                      ) : (
                        <>
                          <Check size={18} />
                          <span>Select</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handledelete(update.id)}
                      disabled={update.selected}
                      className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                      <span>Delete</span>
                    </button>
                    <button
                      onClick={() => handleEdit(update)}
                      className="flex items-center justify-center gap-2 bg-[#9A00FF] hover:bg-[#9c41da] text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                    >
                      <Edit size={18} />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="w-full py-8 text-center text-gray-500">
              No alerts available
            </div>
          )}
        </div>}
      </div>
    </div>
  );
}

export default Updates;