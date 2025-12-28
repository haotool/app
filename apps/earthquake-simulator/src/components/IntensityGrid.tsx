import React from 'react';
import { motion } from 'framer-motion';
import { INTENSITY_LEVELS } from '../data/lessons';

const IntensityGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {INTENSITY_LEVELS.map((item, index) => (
        <motion.div
          key={item.level}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          viewport={{ once: true }}
          className={`relative ${item.color} rounded-3xl p-4 border border-white/40 shadow-sm flex flex-col justify-between h-32`}
        >
          <div className="flex items-start justify-between">
            <span className="text-3xl font-black text-slate-800 italic leading-none">
              {item.level}
            </span>
            <span className="text-[8px] font-black uppercase bg-white/50 px-2 py-0.5 rounded-full text-slate-600 tracking-tighter">
              {item.title}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-700 leading-tight line-clamp-2">
              {item.description}
            </p>
            <div className="flex items-center space-x-1">
              <div className="w-1 h-1 rounded-full bg-slate-800/30" />
              <p className="text-[9px] font-black text-slate-800/60 uppercase">{item.action}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default IntensityGrid;
