import React from "react";
import { Toaster } from "sonner";
import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import ErrorPage from "./components/ErrorPage";
import ErrorBoundary from "./components/ErrorBoundary";
import Signin from "./components/auth/Signin.jsx";
import Signup from "./components/auth/Signup.jsx";
import Verify from "./components/auth/Verify.jsx";
import ForgotPassword from "./components/auth/ForgotPassword.jsx";
import VerifyReset from "./components/auth/VerifyReset.jsx";
import HomePage from "./components/protectedPages/HomePage.jsx";
import { AppProvider, useApp } from "./context/Appcontext.jsx";
import Layout from "./layout/Background.jsx";
import UpperNav from "./components/UpperNav";
import LowerNav from "./components/LowerNav";
import ProfilePage from "./components/protectedPages/ProfilePage.jsx";
import CreateBookPage from "./components/protectedPages/CreateBookPage.jsx";
import CreateScriptPage from "./components/protectedPages/CreateScriptPage.jsx";
import BookDetailPage from "./components/protectedPages/BookDetailsPage.jsx";
import BookReaderPage from "./components/protectedPages/BookReaderPage.jsx";
import ScriptDetailPage from "./components/protectedPages/ScriptDetailPage.jsx";
import MessagesPage from "./components/protectedPages/MessagePage.jsx";
import FollowPage from "./components/protectedPages/FollowPage.jsx";
import ProfileMobile from "./components/protectedPages/ProfileMobile.jsx";
import BookFullReader from "./components/protectedPages/BookFullReader.jsx";
import ScriptFullReader from "./components/protectedPages/ScriptFullReader.jsx";
import ScriptVersionEditPage from "./components/protectedPages/ScriptVersionEditPage.jsx";
import ChapterEditPage from "./components/protectedPages/ChapterEditPage.jsx";
import PoemsPage from "./components/protectedPages/PoemsPage.jsx";
import CreatePoemPage from "./components/protectedPages/CreatePoemPage.jsx";
import ProfileSetup from "./components/auth/ProfileSetup.jsx";
import TermsAndConditions from "./components/auth/TermsAndConditions.jsx";
import RootLayout from "./layout/RootLayout.jsx";
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-amber-500">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
        <p className="font-semibold tracking-wide">Loading Session...</p>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/signin" />;
}

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoute>
            <RootLayout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <HomePage /> },
          { path: "profile/:username?", element: <ProfilePage /> },
          { path: "create/book", element: <CreateBookPage /> },
          { path: "create/script", element: <CreateScriptPage /> },
          { path: "book/:bookId", element: <BookDetailPage /> },
          { path: "book/:bookId/read/:chapterId", element: <BookReaderPage /> },
          { path: "book/:bookId/chapter/:chapterId/edit", element: <ChapterEditPage /> },
          { path: "script/:scriptId", element: <ScriptDetailPage /> },
          { path: "script/:scriptId/version/:versionId/edit", element: <ScriptVersionEditPage /> },
          { path: "messages", element: <MessagesPage /> },
          { path: "follow", element: <FollowPage /> },
          { path: "profileMobile/:username", element: <ProfileMobile /> },
          { path: "poems", element: <PoemsPage /> },
          { path: "create/poem", element: <CreatePoemPage /> },
        ],
      },
      {
        path: "book/:bookId/full-read/:bookId",
        element: (
          <ProtectedRoute>
            <BookFullReader />
          </ProtectedRoute>
        ),
      },
      {
        path: "script/:scriptId/full-read",
        element: (
          <ProtectedRoute>
            <ScriptFullReader />
          </ProtectedRoute>
        ),
      },
      {
        path: "setup-profile",
        element: (
          <ProtectedRoute>
            <Layout>
              <ProfileSetup />
            </Layout>
          </ProtectedRoute>
        ),
      },
      {
        path: "signup",
        element: (
          <Layout>
            <Signup />
          </Layout>
        ),
      },
      {
        path: "signin",
        element: (
          <Layout>
            <Signin />
          </Layout>
        ),
      },
      {
        path: "verify",
        element: (
          <Layout>
            <Verify />
          </Layout>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <Layout>
            <ForgotPassword />
          </Layout>
        ),
      },
      {
        path: "verify-reset",
        element: (
          <Layout>
            <VerifyReset />
          </Layout>
        ),
      },
      {
        path: "test",
        element: (
          <Layout>
            <UpperNav />
            <ErrorPage />
            <LowerNav />
          </Layout>
        ),
      },
      { path: "error", element: <ErrorPage /> },
      { path: "terms", element: <TermsAndConditions /> },
      { path: "*", element: <ErrorPage /> },
    ],
  },
]);

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <RouterProvider router={router} />
        <Toaster position="top-center" />
      </AppProvider>
    </ErrorBoundary>
  );
}


