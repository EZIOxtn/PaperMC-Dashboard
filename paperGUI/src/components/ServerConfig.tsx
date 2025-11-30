import React, { useEffect, useState } from "react";
import { ApiClient } from "../utils/api";

interface Config {
  defJava: string;
  defjavaArgs: string[];
  serverPath: string;
  serverJar: string;
}

export default function ConfigPage() {
  const [config, setConfig] = useState<Config>({
    defJava: "java",
    defjavaArgs: ["-Xmx2G", "-Xms1G", "-jar", "jarPath", "--nogui"],
    serverPath: "",
    serverJar: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Load config from API
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await ApiClient.getConfig();
        if (res.data.success) {
          setConfig(res.data.config);
        } else {
          setMessage("Failed to load config");
        }
      } catch (err) {
        console.error(err);
        setMessage("Error loading config");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Update a field
  const updateField = (key: keyof Config, value: string | string[]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Save config to API
  const saveConfig = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await ApiClient.saveConfig(config);
      if (res.data.success) {
        setMessage("Config saved successfully!");
      } else {
        setMessage("Failed to save config");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error saving config");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading configuration...</div>;

  return ( <div className="min-h-screen w-full flex justify-center items-start p-6 bg-[#0d0f12]">
  <div className="w-full max-w-4xl bg-[#121417] text-white p-8 rounded-2xl shadow-xl border border-[#1f242b]">
    <h2 className="text-3xl font-semibold mb-8 text-[#3cff6c] text-center">
      PaperMC Server Configuration
    </h2>

    {/* Java Executable */}
    <div className="mb-6">
      <label className="block mb-2 font-medium text-gray-300">
        Java Executable
      </label>
      <input
        type="text"
        className="w-full p-3 rounded-lg bg-[#1a1d21] border border-[#2a2f36] focus:border-[#3cff6c] focus:ring-2 focus:ring-[#3cff6c] focus:outline-none transition"
        value={config.defJava}
        onChange={(e) => updateField("defJava", e.target.value)}
      />
    </div>

    {/* Java Args */}
    <div className="mb-6">
      <label className="block mb-2 font-medium text-gray-300">
        Java Args (comma-separated)
      </label>
      <input
        type="text"
        className="w-full p-3 rounded-lg bg-[#1a1d21] border border-[#2a2f36] focus:border-[#3cff6c] focus:ring-2 focus:ring-[#3cff6c] focus:outline-none transition"
        value={config.defjavaArgs.join(", ")}
        onChange={(e) =>
          updateField(
            "defjavaArgs",
            e.target.value.split(",").map((s) => s.trim())
          )
        }
      />
    </div>

    {/* Server Path */}
    <div className="mb-6">
      <label className="block mb-2 font-medium text-gray-300">
        Server Path
      </label>
      <input
        type="text"
        className="w-full p-3 rounded-lg bg-[#1a1d21] border border-[#2a2f36] focus:border-[#3cff6c] focus:ring-2 focus:ring-[#3cff6c] focus:outline-none transition"
        value={config.serverPath}
        
        onChange={(e) => updateField("serverPath", e.target.value)}
      />
    </div>

    {/* Server JAR */}
    <div className="mb-8">
      <label className="block mb-2 font-medium text-gray-300">
        Server Jar
      </label>
      <input
        type="text"
        className="w-full p-3 rounded-lg bg-[#1a1d21] border border-[#2a2f36] focus:border-[#3cff6c] focus:ring-2 focus:ring-[#3cff6c] focus:outline-none transition"
        value={config.serverJar}
        onChange={(e) => updateField("serverJar", e.target.value)}
      />
    </div>

    {/* Save Button */}
    <button
      onClick={saveConfig}
      disabled={saving}
      className={`w-full py-4 rounded-lg font-semibold transition shadow-lg text-black ${
        saving
          ? "bg-gray-600 cursor-not-allowed"
          : "bg-gradient-to-r from-[#29e86d] to-[#0bcf52] hover:shadow-[0_0_20px_#00ff88] hover:brightness-110"
      }`}
    >
      {saving ? "Saving..." : "Save Configuration"}
    </button>

    {/* Message */}
    {message && (
      <p className="mt-4 text-center text-[#3cff6c] font-medium">
        {message}
      </p>
    )}
  </div>
</div>

  );
}
