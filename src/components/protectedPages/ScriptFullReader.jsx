import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../context/Appcontext.jsx";
import { ArrowLeft, Film, GitBranch, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export function ScriptFullReader() {
    const { scriptId } = useParams();
    const navigate = useNavigate();
    const [script, setScript] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedVersionIndex, setSelectedVersionIndex] = useState(0);

    useEffect(() => {
        const loadScript = async () => {
            try {
                const { data } = await api.get(`/scripts/script/search?codee=${scriptId}`);
                if (data.success) {
                    setScript(data.script);
                    const edits = data.script.edits || [];
                    setSelectedVersionIndex(edits.length > 0 ? edits.length - 1 : 0);
                }
            } catch (err) {
                console.error("Failed to load script:", err);
            } finally {
                setLoading(false);
            }
        };
        loadScript();
    }, [scriptId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!script) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="rounded-xl border shadow-sm w-full max-w-md p-8 text-center"
                    style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}>
                    <Film className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-xl font-semibold mb-2">Script Not Found</h2>
                    <Link to="/">
                        <button className="h-10 px-4 rounded-md shadow hover:opacity-90"
                            style={{ backgroundColor: "#D4A574", color: "#FFFFFF" }}>
                            Back to Home
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const versions = script.edits || [];
    const totalVersions = versions.length;
    const currentVersion = versions[selectedVersionIndex] || {};

    return (
        <div className="min-h-screen" style={{ backgroundColor: "#020617" }}>
            {/* Header */}
            <div className="sticky top-0 z-10 border-b"
                style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}>
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button onClick={() => navigate(`/script/${scriptId}`)}
                        className="flex items-center gap-2 h-9 px-3" style={{ color: "#D4A574" }}>
                        <ArrowLeft className="w-4 h-4" />
                        Back to Details
                    </button>
                    <div className="text-center flex-1">
                        <h1 className="text-xl font-bold">{script.title}</h1>
                        <p className="text-sm text-gray-600">by {script.author?.username || "Unknown"}</p>
                    </div>
                    <div className="w-24" />
                </div>

                {/* Version Switcher — only shown when there are multiple versions */}
                {totalVersions > 1 && (
                    <div className="max-w-4xl mx-auto px-4 pb-3 flex items-center gap-2 overflow-x-auto">
                        <button
                            onClick={() => setSelectedVersionIndex(i => Math.max(0, i - 1))}
                            disabled={selectedVersionIndex === 0}
                            className="p-1 rounded disabled:opacity-30 flex-shrink-0"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {versions.map((v, i) => (
                            <button
                                key={v._id || i}
                                onClick={() => setSelectedVersionIndex(i)}
                                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                                    selectedVersionIndex === i
                                        ? "text-white"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                                style={selectedVersionIndex === i ? { backgroundColor: "#D4A574" } : {}}
                            >
                                v{i + 1}{v.editedBy?.username ? ` · ${v.editedBy.username}` : ""}
                            </button>
                        ))}
                        <button
                            onClick={() => setSelectedVersionIndex(i => Math.min(totalVersions - 1, i + 1))}
                            disabled={selectedVersionIndex === totalVersions - 1}
                            className="p-1 rounded disabled:opacity-30 flex-shrink-0"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="rounded-xl border shadow-sm p-8 md:p-12"
                    style={{ backgroundColor: "#FFF8ED", borderColor: "#E5D4C1" }}>

                    <div className="mb-12 text-center">
                        <h1 className="text-4xl font-bold mb-2">{script.title}</h1>
                        <p className="text-lg text-gray-600 mb-4">by {script.author?.username || "Unknown"}</p>
                        <p className="text-gray-700 max-w-2xl mx-auto mb-4">{script.description}</p>
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="px-2 py-1 text-xs rounded-full"
                                style={{ backgroundColor: "#D4A574", color: "#fff" }}>
                                {script.genre || "Drama"}
                            </div>
                            <div className="px-2 py-1 text-xs rounded-full border flex items-center gap-1"
                                style={{ borderColor: "#D4A574", color: "#D4A574" }}>
                                <GitBranch className="w-3 h-3" />
                                v{selectedVersionIndex + 1} of {totalVersions}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="text-center pb-4 border-b-2" style={{ borderColor: "#E5D4C1" }}>
                            <p className="text-sm text-gray-600 italic">Standard screenplay format</p>
                        </div>
                        <div className="font-mono text-sm md:text-base">
                            <pre className="whitespace-pre-wrap leading-relaxed text-gray-900">
                                {currentVersion.body}
                            </pre>
                        </div>
                    </div>

                    {!currentVersion.body && (
                        <div className="text-center py-12">
                            <Film className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600">No content available yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ScriptFullReader;
