import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/Appcontext.jsx";
import { toast } from "sonner";
import { Plus, Trash2, Edit, X } from "lucide-react";

export function CreateBookPage() {

  const { currentUser, addBook } = useApp();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [chapters, setChapters] = useState([]);

  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);

  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContent, setChapterContent] = useState("");

  const handleAddChapter = () => {

    if (!chapterTitle.trim() || !chapterContent.trim()) {
      toast.error("Please fill in chapter title and content");
      return;
    }

    const newChapter = {
      id: Date.now().toString(),
      title: chapterTitle,
      content: chapterContent,
      order: chapters.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setChapters([...chapters, newChapter]);

    setChapterTitle("");
    setChapterContent("");
    setIsAddingChapter(false);

    toast.success("Chapter added!");

  };

  const handleEditChapter = () => {

    if (!editingChapter || !chapterTitle.trim() || !chapterContent.trim()) {
      toast.error("Please fill in chapter title and content");
      return;
    }

    setChapters(
      chapters.map((ch) =>
        ch.id === editingChapter.id
          ? {
            ...ch,
            title: chapterTitle,
            content: chapterContent,
            updatedAt: new Date(),
          }
          : ch
      )
    );

    setChapterTitle("");
    setChapterContent("");
    setEditingChapter(null);

    toast.success("Chapter updated!");

  };

  const handleDeleteChapter = (id) => {

    setChapters(chapters.filter((ch) => ch.id !== id));

    toast.success("Chapter deleted!");

  };

  const openEditDialog = (chapter) => {

    setEditingChapter(chapter);
    setChapterTitle(chapter.title);
    setChapterContent(chapter.content);

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in title and description");
      return;
    }

    if (!currentUser) return;

    try {
      await addBook({
        title,
        description,
        coverImage: coverImage || undefined,
        visibility,
        chapters: chapters.map(ch => ({
          title: ch.title,
          content: ch.content,
          order: ch.order,
        })),
      });
      toast.success("Book created successfully!");
      navigate("/");
    } catch (err) {
      toast.error("Failed to create book");
    }
  };

  return (

    <div className="max-w-4xl mx-auto">
      <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="text-2xl font-semibold leading-none tracking-tight">Create a New Book</h3>
          <p className="text-sm text-gray-500">Share your story with the world</p>
        </div>
        <div className="p-6 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium leading-none text-gray-700">Title *</label>
                <input
                  id="title"
                  placeholder="Enter book title"
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
                  placeholder="Describe your book"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="coverImage" className="text-sm font-medium leading-none text-gray-700">Cover Image URL</label>
                <div className="flex space-x-2">
                  <input
                    id="coverImage"
                    placeholder="https://example.com/cover.jpg"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {coverImage && (
                    <img src={coverImage} alt="Cover preview" className="w-16 h-16 object-cover rounded" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg border-gray-200">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium leading-none">Visibility</label>
                  <p className="text-sm text-gray-500">Make this book visible in homepage suggestions</p>
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
            </div>

            {/* Chapters Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none">Chapters ({chapters.length})</label>
                <button
                  type="button"
                  onClick={() => setIsAddingChapter(true)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-gray-200 hover:bg-gray-100 hover:text-gray-900 h-9 px-3"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Chapter
                </button>

                {/* Add Chapter Dialog */}
                {isAddingChapter && (
                  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                      <div className="flex flex-col space-y-1.5 p-6 pb-4 relative">
                        <h2 className="text-lg font-semibold leading-none tracking-tight">Add New Chapter</h2>
                        <button
                          type="button"
                          onClick={() => setIsAddingChapter(false)}
                          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Close</span>
                        </button>
                      </div>
                      <div className="p-6 pt-0 flex-1 overflow-y-auto space-y-4">
                        <div>
                          <label htmlFor="chapterTitle" className="text-sm font-medium leading-none">Chapter Title</label>
                          <input
                            id="chapterTitle"
                            placeholder="Enter chapter title"
                            value={chapterTitle}
                            onChange={(e) => setChapterTitle(e.target.value)}
                            className="mt-2 flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label htmlFor="chapterContent" className="text-sm font-medium leading-none">Chapter Content</label>
                          <textarea
                            id="chapterContent"
                            placeholder="Write your chapter content..."
                            value={chapterContent}
                            onChange={(e) => setChapterContent(e.target.value)}
                            rows={10}
                            className="mt-2 flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddChapter}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-gray-900/90 h-10 py-2 px-4 w-full shadow"
                          style={{ backgroundColor: '#D4A574', color: '#FFFFFF' }}
                        >
                          Add Chapter
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {chapters.length > 0 ? (
                <div className="space-y-2">
                  {chapters.map((chapter, index) => (
                    <div key={chapter.id} className="flex items-center justify-between p-3 border rounded-lg border-gray-200 bg-white">
                      <div>
                        <p className="font-medium">
                          {index + 1}. {chapter.title}
                        </p>
                        <p className="text-sm text-gray-500">{chapter.content.substring(0, 100)}...</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditDialog(chapter)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-gray-100 hover:text-gray-900 h-9 px-3"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteChapter(chapter.id)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-red-100 h-9 px-3 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Edit Chapter Dialog */}
                  {editingChapter && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="flex flex-col space-y-1.5 p-6 pb-4 relative">
                          <h2 className="text-lg font-semibold leading-none tracking-tight">Edit Chapter</h2>
                          <button
                            type="button"
                            onClick={() => setEditingChapter(null)}
                            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                          </button>
                        </div>
                        <div className="p-6 pt-0 flex-1 overflow-y-auto space-y-4">
                          <div>
                            <label htmlFor="editChapterTitle" className="text-sm font-medium leading-none">Chapter Title</label>
                            <input
                              id="editChapterTitle"
                              placeholder="Enter chapter title"
                              value={chapterTitle}
                              onChange={(e) => setChapterTitle(e.target.value)}
                              className="mt-2 flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <label htmlFor="editChapterContent" className="text-sm font-medium leading-none">Chapter Content</label>
                            <textarea
                              id="editChapterContent"
                              placeholder="Write your chapter content..."
                              value={chapterContent}
                              onChange={(e) => setChapterContent(e.target.value)}
                              rows={10}
                              className="mt-2 flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleEditChapter}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-10 py-2 px-4 w-full shadow"
                            style={{ backgroundColor: '#D4A574', color: '#FFFFFF' }}
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg" style={{ backgroundColor: '#FFF8ED', borderColor: '#E5D4C1' }}>
                  <p className="text-gray-500">No chapters added yet. Click "Add Chapter" to start writing!</p>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex space-x-4">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-10 py-2 px-4 flex-1 shadow"
                style={{ backgroundColor: '#D4A574', color: '#FFFFFF' }}
              >
                Create Book
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

export default CreateBookPage; 