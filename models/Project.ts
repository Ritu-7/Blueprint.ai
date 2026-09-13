import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const ProjectSchema = new Schema(
  {
    user_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    prompt: { type: String, default: '' },
    kind: { type: String, default: 'todo' },
    ui_code: { type: String, default: '' },
    schema_code: { type: String, default: '' },
    api_code: { type: String, default: '' },
    readme_code: { type: String, default: '' },
    files: { type: [Schema.Types.Mixed], default: [] },
    status: { type: String, default: 'active' },
  },
  { timestamps: true }
);

export type ProjectDoc = InferSchemaType<typeof ProjectSchema>;

export default mongoose.models.Project ||
  mongoose.model('Project', ProjectSchema);
