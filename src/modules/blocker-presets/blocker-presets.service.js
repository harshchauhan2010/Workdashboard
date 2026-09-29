import * as presetsRepo from "./blocker-presets.repository";
import { validateCreatePreset } from "./blocker-presets.validator";

// Get all presets created by manager
export async function getAllPresets() {
  return await presetsRepo.findAll();
}

// Get single preset by slug or ID
export async function getPresetBySlugOrId(identifier) {
  if (!identifier) {
    throw new Error("Preset slug or ID is required");
  }

  let preset = await presetsRepo.findBySlug(identifier);
  if (!preset) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        identifier
      );
    if (isUuid) {
      preset = await presetsRepo.findById(identifier);
    }
  }

  if (!preset) {
    throw new Error("Blocker preset not found");
  }

  return preset;
}

// Create new blocker preset (Manager Action)
export async function createPreset(payload) {
  const validation = validateCreatePreset(payload);
  if (!validation.isValid) {
    throw new Error(`Validation Error: ${validation.errors.join("; ")}`);
  }

  const normalizedSlug = payload.key_slug.trim().toLowerCase().replace(/\s+/g, "_");

  const existing = await presetsRepo.findBySlug(normalizedSlug);
  if (existing) {
    throw new Error(`Preset with key_slug '${normalizedSlug}' already exists`);
  }

  return await presetsRepo.createPreset({
    keySlug: normalizedSlug,
    label: payload.label.trim(),
    category: payload.category || "TECHNICAL_IMPEDIMENT",
    severity: payload.severity || "CRITICAL_BLOCKER",
    descriptionTemplate: payload.description_template.trim(),
    impactTemplate: payload.impact_template.trim(),
    mitigationTemplate: payload.mitigation_template.trim(),
  });
}

// Delete blocker preset
export async function deletePreset(identifier) {
  const existing = await getPresetBySlugOrId(identifier);
  return await presetsRepo.deletePreset(existing.id);
}
