'use client';

import { useState } from 'react';
import Papa from 'papaparse';

type BaseRow = { [key: string]: string };
type CSVRow = BaseRow & {
  status?: 'pending' | 'success' | 'error';
  prompt?: string;
};

export default function HomePage() {
  const [data, setData] = useState<CSVRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results: { data: CSVRow[] }) {
        const withStatus = results.data.map((row) => {
          const { status, ...rest } = row;
          return {
            ...rest,
            status: 'pending',
            prompt: row['Cold Mail Prompt'] || '',
          };
        });
        setData(withStatus as CSVRow[]);
      },
    });
  };

  const sendMail = async () => {
    setLoading(true);
    const updatedData = [...data];

    for (let i = 0; i < updatedData.length; i++) {
      const row = updatedData[i];
      try {
        const res = await fetch('/api/send-mails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rows: [row],
            template: row.prompt || '',
            subject: 'Hello {{name}}, Quick Intro!',
          }),
        });

        updatedData[i].status = res.ok ? 'success' : 'error';
      } catch (err) {
        updatedData[i].status = 'error';
      }

      // Update UI after each mail
      setData([...updatedData]);
    }

    setLoading(false);
  };

  return (
    <main className="p-8 max-w-screen-xl mx-auto bg-gray-50 min-h-screen flex items-center justify-center flex-col space-y-4 rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Upload CSV for Email Sending</h1>

      <div className="flex justify-center mb-6">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="border-2 border-gray-300 rounded-lg p-2 text-sm file:text-blue-600 file:border-none file:bg-blue-50 file:cursor-pointer"
        />
      </div>

      {data.length > 0 && (
        <>
          <table className="w-full border border-collapse border-gray-300 mt-4 text-sm shadow-md rounded-lg">
            <thead>
              <tr className="bg-blue-100 text-blue-600">
                {Object.keys(data[0])
                  .filter((key) => key !== 'status' && key !== 'Cold Mail Prompt' && key !== 'prompt')
                  .map((key) => (
                    <th key={key} className="border p-3 text-left font-medium">{key}</th>
                  ))}
                <th className="border p-3 text-left font-medium">Prompt</th>
                <th className="border p-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-100 transition-colors">
                  {Object.entries(row)
                    .filter(([key]) => key !== 'status' && key !== 'Cold Mail Prompt' && key !== 'prompt')
                    .map(([_, val], i) => (
                      <td key={i} className="border p-2 text-left">{val}</td>
                    ))}
                  <td className="border p-2 w-96">
                    <textarea
                      className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      rows={5}
                      value={row.prompt}
                      onChange={(e) => {
                        const newData = [...data];
                        newData[idx].prompt = e.target.value;
                        setData(newData);
                      }}
                    />
                  </td>
                  <td className="border p-2">
                    {row.status === 'success' ? (
                      <span className="text-green-600">✅ Sent</span>
                    ) : row.status === 'error' ? (
                      <span className="text-red-600">❌ Failed</span>
                    ) : (
                      <span className="text-gray-500">⌛ Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-center mt-6">
            <button
              onClick={sendMail}
              disabled={loading}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Sending...' : 'Send Emails'}
            </button>
          </div>
        </>
      )}

      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>
          Made with 💙 by <a href="https://github.com/rohit-coder" className="text-blue-600 hover:underline">Rohit_Coder</a>
        </p>
      </footer>
    </main>
  );
}
