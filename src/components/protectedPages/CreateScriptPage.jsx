import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/Appcontext.jsx";
import { toast } from "sonner";
import { GitBranch, User, Clock, X } from "lucide-react";
import { format } from "date-fns";

const genres = ["Drama", "Comedy", "Action", "Horror", "Sci-Fi", "Romance", "Thriller"];
const purposes = ["Short Film", "Feature Film", "TV Series", "Web Series", "Theater", "Other"];

export function CreateScriptPage() {

  const { currentUser, addScript } = useApp();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");

  const [genre, setGenre] = useState("Drama");
  const [purpose, setPurpose] = useState("Short Film");

  const [visibility, setVisibility] = useState("public");

  const [content, setContent] = useState("");
  const [versionMessage, setVersionMessage] = useState("Initial version");

  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorInput, setCollaboratorInput] = useState("");

  const [versions, setVersions] = useState([]);

  const [activeTab, setActiveTab] = useState("details");

  const handleAddCollaborator = () => {

    if (
      collaboratorInput.trim() &&
      !collaborators.includes(collaboratorInput.trim())
    ) {

      setCollaborators([...collaborators, collaboratorInput.trim()]);
      setCollaboratorInput("");

      toast.success("Collaborator added!");

    }

  };

  const handleRemoveCollaborator = (username) => {

    setCollaborators(collaborators.filter((c) => c !== username));

  };

  const handleSaveVersion = () => {

    if (!content.trim()) {
      toast.error("Please write some content before saving a version");
      return;
    }

    if (!currentUser) return;

    const newVersion = {

      id: Date.now().toString(),
      content,
      editedBy: currentUser.id,
      editorName: currentUser.username,
      timestamp: new Date(),
      message: versionMessage,

    };

    setVersions([newVersion, ...versions]);

    setVersionMessage("");

    toast.success("Version saved!");

  };

  const handleLoadVersion = (version) => {

    setContent(version.content);

    toast.success("Version loaded!");

  };

  const handleSubmit = (e) => {

    e.preventDefault();

    if (!title.trim() || !description.trim() || !content.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!currentUser) return;

    const initialVersion = {

      id: Date.now().toString(),
      content,
      editedBy: currentUser.id,
      editorName: currentUser.username,
      timestamp: new Date(),
      message: versionMessage || "Initial version",

    };

    const newScript = {

      id: Date.now().toString(),

      title,
      description,
      coverImage,

      author: currentUser.id,
      authorName: currentUser.username,

      genre,
      purpose,
      visibility,

      collaborators,

      versions: [initialVersion, ...versions],
      currentVersion: initialVersion.id,

      likes: [],
      comments: [],

      createdAt: new Date(),
      updatedAt: new Date(),

    };

    addScript(newScript);

    toast.success("Script created successfully!");

    navigate("/");

  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Create a New Script</h3>
          <p className="text-sm text-gray-500">Write your screenplay with version control like GitHub</p>
        </div>
        <div className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="w-full">
              <div className="grid w-full grid-cols-3 items-center justify-center rounded-md p-1 text-gray-500 bg-gray-100 mb-4" style={{ backgroundColor: '#FFF8ED' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'details' ? 'bg-white text-gray-950 shadow-sm' : 'hover:bg-gray-100'}`}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'content' ? 'bg-white text-gray-950 shadow-sm' : 'hover:bg-gray-100'}`}
                >
                  Content
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('versions')}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${activeTab === 'versions' ? 'bg-white text-gray-950 shadow-sm' : 'hover:bg-gray-100'}`}
                >
                  Versions ({versions.length})
                </button>
              </div>

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="title" className="text-sm font-medium leading-none text-gray-700">Title *</label>
                    <input
                      id="title"
                      placeholder="Enter script title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium leading-none text-gray-700">Description *</label>
                    <textarea
                      id="description"
                      placeholder="Describe your script"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="coverImage" className="text-sm font-medium leading-none text-gray-700">Cover Image URL</label>
                    <input
                      id="coverImage"
                      placeholder="Paste image URL for this script (optional)"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="genre" className="text-sm font-medium leading-none text-gray-700">Genre</label>
                      <select
                        id="genre"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value )}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {genres.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="purpose" className="text-sm font-medium leading-none text-gray-700">Purpose</label>
                      <select
                        id="purpose"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {purposes.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg border-gray-200">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium leading-none">Visibility</label>
                      <p className="text-sm text-gray-500">Make this script visible in homepage suggestions</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={visibility === 'public'}
                        onChange={(e) => setVisibility(e.target.checked ? 'public' : 'private')}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D4A574]"></div>
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none text-gray-700">Collaborators</label>
                    <p className="text-sm text-gray-500">Collaborators can edit and create new versions</p>
                    <div className="flex space-x-2">
                      <input
                        placeholder="Enter username"
                        value={collaboratorInput}
                        onChange={(e) => setCollaboratorInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCollaborator())}
                        className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={handleAddCollaborator}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-gray-200 hover:bg-gray-100 hover:text-gray-900 h-10 py-2 px-4"
                      >
                        Add
                      </button>
                    </div>
                    {collaborators.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {collaborators.map((collab) => (
                          <div key={collab} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-100 text-gray-900 space-x-1">
                            <User className="w-3 h-3" />
                            <span>{collab}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCollaborator(collab)}
                              className="ml-1 hover:text-red-600 focus:outline-none"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Content Tab */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="content" className="text-sm font-medium leading-none text-gray-700">Script Content *</label>
                    <textarea
                      id="content"
                      placeholder="Write your script here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={20}
                      className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="versionMessage" className="text-sm font-medium leading-none text-gray-700">Version Message (optional)</label>
                    <input
                      id="versionMessage"
                      placeholder="Describe this version..."
                      value={versionMessage}
                      onChange={(e) => setVersionMessage(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveVersion}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-gray-200 hover:bg-gray-100 hover:text-gray-900 h-10 py-2 px-4 w-full"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    Save as New Version
                  </button>
                </div>
              )}

              {/* Versions Tab */}
              {activeTab === 'versions' && (
                <div className="space-y-4">
                  {versions.length > 0 ? (
                    <div className="space-y-3">
                      {versions.map((version) => (
                        <div key={version.id} className="rounded-xl border shadow-sm overflow-hidden bg-white">
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <GitBranch className="w-4 h-4" />
                                  <span className="font-medium">{version.message}</span>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span className="flex items-center space-x-1">
                                    <User className="w-3 h-3" />
                                    <span>{version.editorName}</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{format(new Date(version.timestamp), 'MMM d, yyyy h:mm a')}</span>
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">{version.content.substring(0, 150)}...</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleLoadVersion(version)}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-gray-200 hover:bg-gray-100 hover:text-gray-900 h-9 px-3"
                              >
                                Load
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border rounded-lg" style={{ backgroundColor: '#FFF8ED', borderColor: '#E5D4C1' }}>
                      <p className="text-gray-500">
                        No versions saved yet. Save versions as you write to track changes.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex space-x-4 pt-4 border-t border-gray-200 mt-6">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-gray-900/90 h-10 py-2 px-4 flex-1 shadow"
                style={{ backgroundColor: '#D4A574', color: '#FFFFFF' }}
              >
                Create Script
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-gray-200 hover:bg-gray-100 hover:text-gray-900 h-10 py-2 px-4"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateScriptPage;