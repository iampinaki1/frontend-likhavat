import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, useApp } from "../../context/Appcontext.jsx";
import { ArrowLeft, Save, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function ScriptVersionEditPage() {
  const { scriptId, versionId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useApp();
  
  const [script, setScript] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [versionContent, setVersionContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState([]);
  const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Load script and versions
  useEffect(() => {
    const loadScriptAndVersions = async () => {
      try {
        const { data } = await api.get(`/scripts/script/search?codee=${scriptId}`);
        if (data.success) {
          setScript(data.script);
          const editsWithContent = data.script.edits || [];
          setVersions(editsWithContent);

          const userId = currentUser?._id || currentUser?.id;
          const authorId = data.script.author?._id || data.script.author;
          setIsOwner(userId && authorId && userId.toString() === authorId.toString());
          
          // Set initial content - if versionId is provided, find that version; otherwise use latest
          if (versionId && editsWithContent.length > 0) {
            const versionIndex = editsWithContent.findIndex(v => 
              (v._id || v.id)?.toString() === versionId?.toString()
            );
            if (versionIndex !== -1) {
              setSelectedVersionIndex(versionIndex);
              setVersionContent(editsWithContent[versionIndex].body || "");
            } else {
              setVersionContent(editsWithContent[editsWithContent.length - 1]?.body || "");
            }
          } else if (editsWithContent.length > 0) {
            const latestIndex = editsWithContent.length - 1;
            setSelectedVersionIndex(latestIndex);
            setVersionContent(editsWithContent[latestIndex].body || "");
          }
        }
      } catch (err) {
        console.error("Failed to load script:", err);
        toast.error("Failed to load script");
      } finally {
        setLoading(false);
      }
    };
    loadScriptAndVersions();
  }, [scriptId, versionId, currentUser]);

  // Handle version switching
  const handleVersionSwitch = (index) => {
    setSelectedVersionIndex(index);
    setVersionContent(versions[index]?.body || "");
  };

  // Handle save
  const handleSave = async () => {
    if (!versionContent.trim()) {
      toast.error("Content cannot be empty");
      return;
    }

    setSaving(true);
    try {
      // If editing existing version
      if (versions[selectedVersionIndex]?._id) {
        const response = await api.put(
          `/scripts/script/${scriptId}/version`,
          {
            versionId: versions[selectedVersionIndex]._id,
            body: versionContent
          }
        );
        if (response.data?.success || response.status === 200) {
          toast.success("Version saved successfully");
          // Update local state
          const updatedVersions = [...versions];
          updatedVersions[selectedVersionIndex].body = versionContent;
          setVersions(updatedVersions);
        }
      } else {
        // Creating new version
        const response = await api.post(
          `/scripts/script/${scriptId}/version`,
          {
            body: versionContent
          }
        );
        if (response.data?.success || response.status === 200) {
          toast.success("New version created successfully");
          // Reload script to get updated versions
          const { data } = await api.get(`/scripts/script/search?codee=${scriptId}`);
          if (data.success) {
            setVersions(data.script.edits || []);
          }
        }
      }
    } catch (err) {
      console.error("Failed to save version:", err);
      toast.error(err.response?.data?.msg || "Failed to save version");
    } finally {
      setSaving(false);
    }
  };

  // Copy to clipboard
  const handleCopyContent = () => {
    navigator.clipboard.writeText(versionContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="rounded-xl border shadow-sm w-full max-w-md p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Script Not Found</h2>
          <button
            onClick={() => navigate("/")}
            className="h-10 px-4 rounded-md mt-4"
            style={{ backgroundColor: "#D4A574", color: "#FFFFFF" }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF8ED" }}>
      {/* Header */}
      <div className="border-b sticky top-0 z-10 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(`/script/${scriptId}`)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: "#D4A574" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Script
            </button>
            <h1 className="text-2xl font-bold text-center flex-1">{script.title}</h1>
            <div className="w-32" />
          </div>

          {/* Version Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {/* Only owner can switch between and edit existing versions */}
            {isOwner && versions.map((version, index) => (
              <button
                key={version._id || index}
                onClick={() => handleVersionSwitch(index)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                  selectedVersionIndex === index
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Version {index + 1}
              </button>
            ))}
            <button
              onClick={() => {
                const lastBody = versions.length > 0 ? versions[versions.length - 1].body || "" : "";
                setSelectedVersionIndex(versions.length);
                setVersionContent(lastBody);
              }}
              className="px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              + New Version
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Editor Panel */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <h2 className="font-semibold">Script Content</h2>
                <button
                  onClick={handleCopyContent}
                  className="flex items-center gap-2 px-3 py-1 rounded text-sm bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={versionContent}
                onChange={(e) => setVersionContent(e.target.value)}
                placeholder="Start writing your script here..."
                className="w-full h-96 p-4 resize-none focus:outline-none border-none font-mono text-sm"
                style={{ fontFamily: "Fira Code, monospace", lineHeight: "1.6" }}
              />
              <div className="p-4 bg-gray-50 border-t flex gap-2 justify-end">
                <button
                  onClick={() => navigate(`/script/${scriptId}`)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || (!isOwner && selectedVersionIndex < versions.length)}
                  className="px-4 py-2 rounded-lg flex items-center gap-2 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: (saving || (!isOwner && selectedVersionIndex < versions.length)) ? "#999" : "#D4A574" }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Version
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Script Info */}
            <div className="rounded-xl border shadow-sm p-4 bg-white">
              <h3 className="font-semibold mb-3">Script Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">TITLE</p>
                  <p className="font-medium">{script.title}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">GENRE</p>
                  <p className="font-medium">{script.genre}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">PURPOSE</p>
                  <p className="font-medium">{script.purpose}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">VISIBILITY</p>
                  <p className="font-medium capitalize">{script.visibility}</p>
                </div>
              </div>
            </div>

            {/* Version Info */}
            <div className="rounded-xl border shadow-sm p-4 bg-white">
              <h3 className="font-semibold mb-3">Current Version</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">VERSION NUMBER</p>
                  <p className="font-medium">v{selectedVersionIndex + 1}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">TOTAL VERSIONS</p>
                  <p className="font-medium">{versions.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">CHARACTER COUNT</p>
                  <p className="font-medium">{versionContent.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">WORD COUNT</p>
                  <p className="font-medium">
                    {versionContent.trim().split(/\s+/).filter(w => w).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScriptVersionEditPage;
