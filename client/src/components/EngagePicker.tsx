/**
 * EngagePicker (IP-9062, closes part of BL-0062) — the previously-missing effector + target +
 * effect selector for Engage. Eligible effectors are the player's own online, engage-role assets;
 * eligible targets are whatever the player has already gathered a belief entry on
 * (OpponentView.beliefEntries — the client can only ever target what it already has some
 * intel on, matching FS-105/FR-4002's targeting-quality-data requirement); effect choices are
 * constrained to the chosen effector's `applicableEffects` (IP-9062's new field) when the server
 * has provided it, falling back to all five with a visible note otherwise (never silently empty).
 */
import { useState } from 'react';
import type { Asset, AssetTemplate, FiveDsEffect, OpponentView, PlayerState } from '@owchess/shared';

const ALL_EFFECTS: FiveDsEffect[] = ['deceive', 'disrupt', 'deny', 'degrade', 'destroy'];

function isEligibleEffector(a: Asset): boolean {
  return a.deployState === null && !a.destroyed && a.chainRoles.includes('engage');
}

function effectOptionsFor(effector: Asset | undefined, templates: AssetTemplate[]): FiveDsEffect[] {
  const template = effector ? templates.find((t) => t.templateId === effector.templateId) : undefined;
  return template?.applicableEffects && template.applicableEffects.length > 0
    ? template.applicableEffects
    : ALL_EFFECTS;
}

export interface EngagePickerProps {
  ownState: PlayerState;
  opponentView: OpponentView;
  templates: AssetTemplate[];
  onSubmit: (effectorAssetId: string, targetAssetId: string, effect: FiveDsEffect) => void;
  onCancel: () => void;
}

export function EngagePicker({ ownState, opponentView, templates, onSubmit, onCancel }: EngagePickerProps) {
  const eligible = [ownState.king, ...ownState.assets].filter(isEligibleEffector);
  const [effectorAssetId, setEffectorAssetId] = useState(eligible[0]?.assetId ?? '');
  const effector = eligible.find((a) => a.assetId === effectorAssetId);
  const effectOptions = effectOptionsFor(effector, templates);
  const effectorTemplate = effector ? templates.find((t) => t.templateId === effector.templateId) : undefined;

  const [targetAssetId, setTargetAssetId] = useState(opponentView.beliefEntries[0]?.subject ?? '');
  const [effect, setEffect] = useState<FiveDsEffect | ''>(effectOptions[0] ?? '');

  function handleEffectorChange(id: string) {
    setEffectorAssetId(id);
    const newEffector = eligible.find((a) => a.assetId === id);
    const newOptions = effectOptionsFor(newEffector, templates);
    setEffect(newOptions[0] ?? '');
  }

  const noEffector = eligible.length === 0;
  const noTarget = opponentView.beliefEntries.length === 0;

  return (
    <div data-testid="engage-picker">
      <h3>Engage</h3>
      {noEffector ? (
        <div data-testid="engage-picker-empty-effector">No eligible online effector.</div>
      ) : noTarget ? (
        <div data-testid="engage-picker-empty-target">No known opponent contact to engage yet.</div>
      ) : (
        <>
          <select
            data-testid="engage-effector-select"
            value={effectorAssetId}
            onChange={(e) => handleEffectorChange(e.target.value)}
          >
            {eligible.map((a) => (
              <option key={a.assetId} value={a.assetId}>
                {a.assetId}
              </option>
            ))}
          </select>
          <select
            data-testid="engage-target-select"
            value={targetAssetId}
            onChange={(e) => setTargetAssetId(e.target.value)}
          >
            {opponentView.beliefEntries.map((entry) => (
              <option key={entry.subject} value={entry.subject}>
                {entry.subject} ({entry.precision})
              </option>
            ))}
          </select>
          <select
            data-testid="engage-effect-select"
            value={effect}
            onChange={(e) => setEffect(e.target.value as FiveDsEffect)}
          >
            {effectOptions.map((eff) => (
              <option key={eff} value={eff}>
                {eff}
              </option>
            ))}
          </select>
          {!effectorTemplate?.applicableEffects && (
            <div data-testid="engage-effect-unconstrained-note">
              This effector's allowed effects aren't listed by the server yet — the server may
              reject an illegal choice.
            </div>
          )}
          <button
            type="button"
            data-testid="engage-submit"
            disabled={!effectorAssetId || !targetAssetId || !effect}
            onClick={() =>
              effectorAssetId && targetAssetId && effect && onSubmit(effectorAssetId, targetAssetId, effect)
            }
          >
            Confirm Engage
          </button>
        </>
      )}
      <button type="button" data-testid="engage-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
