import React, { useState, useEffect } from "react";
import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer
} from "recharts";
import "./App.css";

const BACKEND_URL = "https://sme-vision-backend.onrender.com";

function App() {
  
  const [showIntro, setShowIntro] = useState(true);
  const [expandTitle, setExpandTitle] = useState(false);

  
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [lang, setLang] = useState("english");
  const [loading, setLoading] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  
  useEffect(() => {
    const t1 = setTimeout(() => {
      setExpandTitle(true);

      const welcome = new SpeechSynthesisUtterance(
        "Welcome to SME Vision"
      );
      welcome.lang = "en-US";
      welcome.rate = 0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(welcome);
    }, 1800);

    const t2 = setTimeout(() => setShowIntro(false), 4200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  
  const uploadFile = async () => {
    if (!file) {
      alert("Please select a CSV / XLSX / PDF file");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `${BACKEND_URL}/analyze/final-report`,
      {
        method: "POST",
        body: formData
      }
    );

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  
  const downloadPDF = async () => {
    const res = await fetch(
      `${BACKEND_URL}/download-pdf`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result)
      }
    );

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SME_Financial_Report.pdf";
    a.click();
  };

  
  const playVoiceSummary = () => {
    const text = result.ai_summary[lang];
    const u = new SpeechSynthesisUtterance(text);
    u.lang =
      lang === "tamil" ? "ta-IN" :
      lang === "hindi" ? "hi-IN" : "en-US";

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  
  const sendChat = () => {
    if (!chatInput) return;

    setChatHistory(prev => [
      ...prev,
      { role: "user", text: chatInput },
      {
        role: "bot",
        text:
          "Your financial profile looks suitable for a business loan."
      }
    ]);
    setChatInput("");
  };

  
  if (showIntro) {
    return (
      <div className="netflix-bg">
        {!expandTitle ? (
          <h1 className="netflix-single">SME</h1>
        ) : (
          <h1 className="netflix-multi">
            SME <span>VISION</span>
          </h1>
        )}
      </div>
    );
  }

  
  return (
    <div className="container analyze-animate">
      <h1 className="fade-title">📊 SME Financial Health Dashboard</h1>

      <input
        type="file"
        accept=".csv,.xlsx,.pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={uploadFile}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {result && (
        <>
          {/* METRICS */}
          <div className="cards">
            <div className="card green">
              💰 Income ₹{result.investor_metrics.total_income}
            </div>
            <div className="card red">
              💸 Expense ₹{result.investor_metrics.total_expense}
            </div>
            <div className="card blue">
              📈 Profit ₹{result.investor_metrics.net_profit}
            </div>
            <div className="card purple">
              🏦 Credit {result.investor_metrics.credit_score}
            </div>
          </div>

          {/* BAR CHART */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { name: "Income", value: result.investor_metrics.total_income },
                { name: "Expense", value: result.investor_metrics.total_expense }
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#38bdf8" />
            </BarChart>
          </ResponsiveContainer>

          {/* AI SUMMARY */}
          <h2>🤖 AI Summary</h2>
          <button onClick={() => setLang("english")}>English</button>
          <button onClick={() => setLang("tamil")} style={{ marginLeft: 10 }}>
            Tamil
          </button>
          <button onClick={() => setLang("hindi")} style={{ marginLeft: 10 }}>
            Hindi
          </button>

          <div className="card green" style={{ marginTop: 15 }}>
            {result.ai_summary[lang]}
          </div>

          <button onClick={playVoiceSummary} style={{ marginTop: 10 }}>
            🔊 Voice Summary
          </button>

          {/* LOAN */}
          <h2 style={{ marginTop: 30 }}>🏦 Loan Recommendation</h2>
          <div className="card blue">
            <p>Eligibility: <b>{result.loan_recommendation.eligible}</b></p>
            <p>Amount: ₹{result.loan_recommendation.recommended_amount}</p>
            <p>Tenure: {result.loan_recommendation.tenure_months} months</p>
            <p>Risk Level: {result.loan_recommendation.risk_level}</p>
          </div>

          {/* CHATBOT */}
          <div className="netflix-chatbot">
            <h2>💬 Ask AI</h2>

            <div className="chat-window">
              {chatHistory.map((m, i) => (
                <div
                  key={i}
                  className={m.role === "user" ? "user-msg" : "bot-msg"}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <div className="chat-input">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about loan, EMI, risk..."
              />
              <button onClick={sendChat}>Send</button>
            </div>

            <button className="pdf-btn" onClick={downloadPDF}>
              📄 Download PDF Report
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;