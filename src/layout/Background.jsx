import LoginBackground from "../components/LoginBackground.jsx";

export default function Layout({ children }) {
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <LoginBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
