import { useEffect } from "react";

const DEVANAGARI = [
  // Hindi Vowels
  "अ","आ","इ","ई","उ","ऊ","ऋ","ए","ऐ","ओ","औ","अं","अः",

  "लिखावट",
  // Hindi Consonants
  "क","ख","ग","घ","ङ",
  "च","छ","ज","झ","ञ",
  "ट","ठ","ड","ढ","ण",
  "त","थ","द","ध","न",
  "प","फ","ब","भ","म",
  "य","र","ल","व",
  "श","ष","स","ह",
  "क्ष","त्र","ज्ञ","likhabat",

  "लिखावट",
  // English Capital
  "A","B","C","D","E","F","G","H","I","J","K","L","M",
  "N","O","P","Q","R","S","T","U","V","W","X","Y","Z",

  "लिखावट",
  // English Small
  "a","b","c","d","e","f","g","h","i","j","k","l","m",
  "n","o","p","q","r","s","t","u","v","w","x","y","z",
  "likhabat",
];

export default function LoginBackground() {
  useEffect(() => {
    const container = document.getElementById("particleBox");
    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < 40; i++) {
      const span = document.createElement("span");
      span.className = "particle";
      span.innerText = DEVANAGARI[Math.floor(Math.random() * DEVANAGARI.length)];
      span.style.left = Math.random() * 100 + "%";
      span.style.animationDuration = 10 + Math.random() * 10 + "s";
      span.style.animationDelay = Math.random() * 5 + "s";
      span.style.fontSize = 16 + Math.random() * 24 + "px";
      container.appendChild(span);
    }
  }, []);

  return <div id="particleBox" aria-hidden="true" />;
}
