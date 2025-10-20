import type { ConversionHistoryEntry } from '../types';

interface ConversionHistoryProps {
  history: ConversionHistoryEntry[];
}

export const ConversionHistory = ({ history }: ConversionHistoryProps) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 mt-4 md:mt-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">轉換歷史</h2>
      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={`${item.time}-${item.amount}-${item.to}`}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{item.time}</span>
              <span className="font-semibold">
                {item.amount} {item.from}
              </span>
              <span className="text-gray-400">→</span>
              <span className="font-semibold text-purple-600">
                {item.result} {item.to}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
