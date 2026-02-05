import Layout from "./layout/Background.jsx";
import GlassCard from "./components/GlassCard.jsx";
import Signin from "./components/Signin.jsx";
import Signup from "./components/Signup.jsx";
import Verify from "./components/Verify.jsx";
import UpperNav from "./components/UpperNav.jsx";
import LowerNav from "./components/LowerNav.jsx";

export default function App() {
  return (
    <Layout>
<UpperNav/>
      <Signup/>
 <LowerNav/>
    </Layout>

  );
}
