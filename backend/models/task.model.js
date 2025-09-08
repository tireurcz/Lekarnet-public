const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    dueDate: { type: Date, default: null },

    // cílení: primárně na pobočku
    pharmacyCodes: { type: [String], index: true, default: [] }, // např. ["0064","LIDL",...]
    // volitelně i na konkrétní uživatele do budoucna (ponecháme háček)
    userIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },

    // stav úkolu – globální (pokud budeš chtít)
    status: { type: String, enum: ['open', 'done', 'archived'], default: 'open', index: true },

    // dokončení per-cíl (dává smysl pro více poboček v jednom úkolu)
    // klíčem je pharmacyCode nebo userId (string), hodnota metadata dokončení
    completions: {
      type: Map,
      of: new mongoose.Schema(
        {
          done: { type: Boolean, default: false },
          doneAt: { type: Date, default: null },
          doneBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
          note: { type: String, default: '' },
        },
        { _id: false }
      ),
      default: {}
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// praktické indexy
TaskSchema.index({ deletedAt: 1 });
TaskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Task', TaskSchema);
