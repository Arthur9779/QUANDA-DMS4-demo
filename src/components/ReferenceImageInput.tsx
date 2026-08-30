"use client";

import { Check, ImagePlus, LoaderCircle, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Translation } from "@/src/i18n/translations";
import {
  ReferenceImageResponseSchema,
  type ReferenceImageFinding,
} from "@/src/reference-image/contracts";

interface ReferenceImageInputProps {
  projectBrief: string;
  t: Translation;
  onApprovedFindingsChange?: (findings: ReferenceImageFinding[]) => void;
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export function ReferenceImageInput({
  projectBrief,
  t,
  onApprovedFindingsChange = () => undefined,
}: ReferenceImageInputProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [findings, setFindings] = useState<ReferenceImageFinding[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const clearApproval = () => {
    if (!isApproved) return;
    setIsApproved(false);
    onApprovedFindingsChange([]);
  };

  const chooseFile = (nextFile: File | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    setError(null);
    setFindings([]);
    setSelectedIds(new Set());
    clearApproval();
    if (!nextFile) {
      setFile(null);
      return;
    }
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(nextFile.type) ||
      nextFile.size > MAX_IMAGE_BYTES
    ) {
      setFile(null);
      setError(t.form.referenceImage.invalidFile);
      return;
    }
    setFile(nextFile);
    const url = URL.createObjectURL(nextFile);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  };

  const analyze = async () => {
    if (!file || isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    setFindings([]);
    clearApproval();
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25_000);
    try {
      const body = new FormData();
      body.append("image", file);
      body.append("projectBrief", projectBrief);
      const response = await fetch("/api/reference-image", {
        method: "POST",
        body,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`reference_${response.status}`);
      const parsed = ReferenceImageResponseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("reference_invalid");
      setFindings(parsed.data.findings);
      setSelectedIds(new Set(parsed.data.findings.map((finding) => finding.id)));
    } catch {
      setError(t.form.referenceImage.analysisError);
    } finally {
      window.clearTimeout(timeout);
      setIsAnalyzing(false);
    }
  };

  const toggleFinding = (id: string) => {
    clearApproval();
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const approve = () => {
    const approved = findings.filter((finding) => selectedIds.has(finding.id));
    if (approved.length === 0) return;
    onApprovedFindingsChange(approved);
    setIsApproved(true);
  };

  const remove = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPreviewUrl(null);
    setFile(null);
    setFindings([]);
    setSelectedIds(new Set());
    setError(null);
    clearApproval();
  };

  return (
    <fieldset className="reference-image-fieldset">
      <legend>
        {t.form.referenceImage.title} <small>{t.form.optional}</small>
      </legend>
      <p className="reference-image-intro">{t.form.referenceImage.intro}</p>
      {!file ? (
        <label className="reference-image-dropzone">
          <ImagePlus aria-hidden="true" size={24} />
          <span>
            <strong>{t.form.referenceImage.choose}</strong>
            <small>{t.form.referenceImage.fileHint}</small>
          </span>
          <input
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
      ) : (
        <div className="reference-image-file">
          {previewUrl && (
            // A local object URL is used only for the on-device preview.
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={t.form.referenceImage.previewAlt} src={previewUrl} />
          )}
          <div>
            <strong>{file.name}</strong>
            <small>{t.form.referenceImage.privacy}</small>
            <div className="reference-image-actions">
              <button
                className="button button-secondary"
                disabled={isAnalyzing}
                onClick={() => void analyze()}
                type="button"
              >
                {isAnalyzing ? (
                  <LoaderCircle aria-hidden="true" className="spin" size={16} />
                ) : (
                  <Sparkles aria-hidden="true" size={16} />
                )}
                {isAnalyzing
                  ? t.form.referenceImage.analyzing
                  : findings.length > 0
                    ? t.form.referenceImage.analyzeAgain
                    : t.form.referenceImage.analyze}
              </button>
              <button
                aria-label={t.form.referenceImage.remove}
                className="button button-text"
                disabled={isAnalyzing}
                onClick={remove}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} />
                {t.form.referenceImage.remove}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="field-error reference-image-error" role="alert">{error}</p>}

      {findings.length > 0 && (
        <div className="reference-findings" aria-labelledby="reference-findings-title">
          <div className="reference-findings-heading">
            <div>
              <strong id="reference-findings-title">{t.form.referenceImage.findingsTitle}</strong>
              <p>{t.form.referenceImage.findingsHint}</p>
            </div>
            {isApproved && (
              <span className="reference-approved">
                <Check aria-hidden="true" size={14} />
                {t.form.referenceImage.approved}
              </span>
            )}
          </div>
          <div className="reference-finding-grid">
            {findings.map((finding) => (
              <label className="reference-finding" key={finding.id}>
                <input
                  checked={selectedIds.has(finding.id)}
                  onChange={() => toggleFinding(finding.id)}
                  type="checkbox"
                />
                <span>
                  <strong>{finding.ontology?.label ?? finding.label}</strong>
                  <small>{finding.evidence}</small>
                  {finding.ontology && (
                    <em>{t.form.referenceImage.knowledgeMatch}</em>
                  )}
                </span>
              </label>
            ))}
          </div>
          <button
            className="button button-primary reference-approve-button"
            disabled={selectedIds.size === 0 || isApproved}
            onClick={approve}
            type="button"
          >
            <Check aria-hidden="true" size={16} />
            {isApproved
              ? t.form.referenceImage.approved
              : t.form.referenceImage.useSelected}
          </button>
        </div>
      )}
    </fieldset>
  );
}
