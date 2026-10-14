"use client";

import React from "react";

export function TirangaDripHeader() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Background warm festive base */}
      <div 
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #FFF9F2 0%, #FFFFFF 100%)",
        }}
      />

      {/* Monuments Silhouette (India Gate / Red Fort subtle bottom watermark) */}
      <svg
        className="absolute bottom-0 inset-x-0 w-full h-16 opacity-15"
        viewBox="0 0 500 80"
        preserveAspectRatio="none"
      >
        <path
          d="M0,80 L0,65 L40,65 L50,55 L60,65 L120,65 L130,50 L140,50 L150,65 L210,65 L220,35 L230,35 L235,25 L245,25 L250,15 L255,25 L265,25 L270,35 L280,35 L290,65 L360,65 L370,55 L380,55 L390,65 L450,65 L460,50 L470,65 L500,65 L500,80 Z"
          fill="#B45309"
        />
        {/* India Gate archway in center */}
        <path
          d="M235,80 L235,50 Q250,42 265,50 L265,80 Z"
          fill="#FFF9F2"
        />
      </svg>

      {/* Ashoka Chakra Center Watermark */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-28 h-28 opacity-20 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full text-slate-700 animate-[spin_60s_linear_infinite]">
          <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="6" />
          <circle cx="100" cy="100" r="14" fill="currentColor" />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180;
            const x2 = 100 + 90 * Math.cos(angle);
            const y2 = 100 + 90 * Math.sin(angle);
            return (
              <line
                key={i}
                x1="100"
                y1="100"
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth="3"
              />
            );
          })}
        </svg>
      </div>

      {/* Flying Freedom Birds */}
      <svg className="absolute top-8 left-[58%] w-5 h-5 text-amber-600/40" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,4 Q16,8 20,4 Q16,12 12,8 Q8,12 4,4 Q8,8 12,4 Z" />
      </svg>
      <svg className="absolute top-12 left-[66%] w-4 h-4 text-emerald-700/40" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,4 Q16,8 20,4 Q16,12 12,8 Q8,12 4,4 Q8,8 12,4 Z" />
      </svg>
      <svg className="absolute top-9 left-[38%] w-4 h-4 text-orange-600/35" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,4 Q16,8 20,4 Q16,12 12,8 Q8,12 4,4 Q8,8 12,4 Z" />
      </svg>

      {/* Top High-Fidelity Melting & Dripping Paint Header (Saffron -> White -> Green) */}
      <svg
        className="absolute top-0 inset-x-0 w-full h-24 drop-shadow-md"
        viewBox="0 0 600 120"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="saffronDrip" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF671F" />
            <stop offset="70%" stopColor="#FF9933" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>
          <linearGradient id="whiteDrip" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="80%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
          <linearGradient id="greenDrip" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#046A38" />
            <stop offset="70%" stopColor="#138808" />
            <stop offset="100%" stopColor="#0A5C04" />
          </linearGradient>
          {/* 3D Gloss Highlight Filter */}
          <filter id="gloss" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* 1. Left Section: Saffron / Orange Dripping Paint */}
        <g filter="url(#gloss)">
          <path
            d="M0,0 L210,0 
               C205,25 200,45 195,50 
               C190,56 185,42 180,35 
               C175,28 170,68 165,72 
               C160,76 155,50 150,38 
               C145,26 140,88 135,92 
               C130,96 125,58 120,45 
               C115,32 110,75 105,78 
               C100,81 95,52 90,40 
               C85,28 80,105 75,108 
               C70,111 65,65 60,50 
               C55,35 50,85 45,88 
               C40,91 35,60 30,48 
               C25,36 20,95 15,98 
               C10,101 5,45 0,35 Z"
            fill="url(#saffronDrip)"
          />
          {/* Saffron Splashes & Isolated Falling Drops */}
          <circle cx="75" cy="116" r="4.5" fill="#FF7700" />
          <circle cx="75" cy="122" r="2.5" fill="#E65100" />
          <circle cx="135" cy="100" r="3.5" fill="#FF7700" />
          <circle cx="15" cy="106" r="3" fill="#FF7700" />
          <circle cx="45" cy="96" r="2.5" fill="#FF7700" />
          <circle cx="105" cy="86" r="2" fill="#FF7700" />
          <circle cx="165" cy="80" r="2" fill="#FF7700" />
        </g>

        {/* 2. Center Section: White Melting Dripping Paint */}
        <g filter="url(#gloss)">
          <path
            d="M190,0 L410,0 
               C405,28 400,52 395,58 
               C390,64 385,40 380,32 
               C375,24 370,65 365,70 
               C360,75 355,48 350,38 
               C345,28 340,78 335,82 
               C330,86 325,55 320,42 
               C315,29 310,65 305,68 
               C300,71 295,45 290,35 
               C285,25 280,82 275,86 
               C270,90 265,58 260,45 
               C255,32 250,72 245,76 
               C240,80 235,50 230,38 
               C225,26 220,68 215,72 
               C210,76 205,42 200,32 
               C195,22 192,10 190,0 Z"
            fill="url(#whiteDrip)"
          />
          {/* White Droplets */}
          <circle cx="275" cy="94" r="3.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.5" />
          <circle cx="335" cy="90" r="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.5" />
          <circle cx="245" cy="82" r="2.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.5" />
        </g>

        {/* 3. Right Section: India Green Dripping Paint */}
        <g filter="url(#gloss)">
          <path
            d="M390,0 L600,0 L600,35 
               C595,45 590,95 585,98 
               C580,101 575,60 570,48 
               C565,36 560,88 555,92 
               C550,96 545,65 540,52 
               C535,39 530,108 525,112 
               C520,116 515,68 510,54 
               C505,40 500,82 495,86 
               C490,90 485,55 480,42 
               C475,29 470,92 465,96 
               C460,100 455,58 450,45 
               C445,32 440,75 435,78 
               C430,81 425,50 420,38 
               C415,26 410,65 405,68 
               C400,71 395,42 390,0 Z"
            fill="url(#greenDrip)"
          />
          {/* Green Splashes & Isolated Falling Drops */}
          <circle cx="525" cy="120" r="4.5" fill="#138808" />
          <circle cx="525" cy="126" r="2.5" fill="#0A5C04" />
          <circle cx="465" cy="104" r="3.5" fill="#138808" />
          <circle cx="585" cy="106" r="3" fill="#138808" />
          <circle cx="555" cy="100" r="2.5" fill="#138808" />
          <circle cx="495" cy="94" r="2" fill="#138808" />
          <circle cx="435" cy="86" r="2" fill="#138808" />
        </g>
      </svg>
    </div>
  );
}
