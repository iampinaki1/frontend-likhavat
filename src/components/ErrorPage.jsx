import Layout from "../layout/Background.jsx";
import { Link } from "react-router-dom";
import { useRouteError } from 'react-router-dom'

export default function Error404() {
  const err = useRouteError() || {};
  return (
    <>
      <Layout>
        <Link to="/">
          <div className="wrapper">
            <div className="stars"></div>

            <div className="tubelightWrapper">
              <div className="wire"></div>
              <div className="tubelight"></div>
            </div>

            <div className="light"></div>

            <div className="content">
              <h1 className="title">
                <div className="font-extrabold">PAGE NOT FOUND</div>
              </h1>

              <p className="text">[click anywhere to land in homepage]</p>
              {err && (err.message || err.statusText) && (
                <p className="text-red-400 mt-4 text-sm font-mono bg-black/50 p-2 rounded">
                  Error: {err.statusText || err.message}
                </p>
              )}
            </div>
          </div>
        </Link>

        <style>{`

      .wrapper{
        height:100vh;
        position:relative;
        background:transparent;
        color:white;
        display:flex;
        align-items:center;
        justify-content:center;
        overflow:hidden;
        font-family:Montserrat, sans-serif;
      }


      /* tubelight */

      .tubelightWrapper{
        position:absolute;
        top:0;
        left:50%;
        transform-origin:top center;
        animation:swing 4s ease-in-out infinite;
      }

      @keyframes swing{
        0%{transform:translateX(-50%) rotate(15deg)}
        50%{transform:translateX(-50%) rotate(-15deg)}
        100%{transform:translateX(-50%) rotate(15deg)}
      }

      .wire{
        width:4px;
        height:150px;
        background:#888;
        margin:auto;
      }

      .tubelight{
        width:260px;
        height:12px;
        background:#e8ffff;
        border-radius:10px;
        box-shadow:
        0 0 20px #9fffff,
        0 0 40px #7fffff,
        0 0 80px #5fffff;
        animation:tubeFlicker 6s infinite;
      }

      /* flicker */

      @keyframes tubeFlicker{

        0%{opacity:1}
        2%{opacity:.4}
        4%{opacity:1}

        7%{opacity:.2}
        8%{opacity:1}

        12%{opacity:.6}
        14%{opacity:1}

        28%{opacity:.3}
        30%{opacity:1}

        48%{opacity:.7}
        50%{opacity:1}

        60%{opacity:.2}
        61%{opacity:1}

        75%{opacity:.5}
        78%{opacity:1}

        100%{opacity:1}
      }

      /* light beam */

     

      /* text */

      .content{
        position:absolute;
        top:60%;
        left:50%;
        transform:translate(-50%,-50%);
        text-align:center;
      }

      .title{
        font-size:60px;
        letter-spacing:4px;
      }

      .text{
        opacity:.7;
        margin-top:10px;
      }
      `}</style>
      </Layout>
    </>
  );
}
