"""
TemplateRegistry — loads mission-set/asset-type/effect-definition content JSON from
python-mvp/content/ (a copy of server/src/content/*, the authoritative source — see
memory.md if the two ever disagree). Mirrors server/src/engine/TemplateRegistry.ts.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

CONTENT_DIR = Path(__file__).resolve().parent.parent / "content"


@dataclass
class AssetTemplate:
    template_id: str
    basing: str
    ap_cost: int
    time_to_online: int
    chain_roles: list[str]
    regime_affinity: list[str]
    applicable_effects: list[str] = field(default_factory=list)


@dataclass
class MissionSetTemplate:
    mission_set_id: str
    asset_type_ids: list[str]
    king_regime_affinity: list[str]


@dataclass
class EffectDefinition:
    effect_id: str
    duration_turns: object
    stacking: str
    allowed_effector_template_ids: list[str]


class TemplateRegistry:
    def __init__(self) -> None:
        self.asset_templates: dict[str, AssetTemplate] = {}
        self.mission_sets: dict[str, MissionSetTemplate] = {}
        self.effects: dict[str, EffectDefinition] = {}
        self._load()

    def _load(self) -> None:
        effects: dict[str, EffectDefinition] = {}
        for path in sorted((CONTENT_DIR / "effects").glob("*.json")):
            data = json.loads(path.read_text())
            effects[data["effectId"]] = EffectDefinition(
                effect_id=data["effectId"],
                duration_turns=data["durationTurns"],
                stacking=data["stacking"],
                allowed_effector_template_ids=data["allowedEffectorTemplateIds"],
            )
        self.effects = effects

        # applicableEffects per asset template: which effect defs list it as an allowed effector.
        effector_to_effects: dict[str, list[str]] = {}
        for eff in effects.values():
            for tid in eff.allowed_effector_template_ids:
                effector_to_effects.setdefault(tid, []).append(eff.effect_id)

        asset_templates: dict[str, AssetTemplate] = {}
        for path in sorted((CONTENT_DIR / "assetTypes").glob("*.json")):
            data = json.loads(path.read_text())
            tid = data["templateId"]
            asset_templates[tid] = AssetTemplate(
                template_id=tid,
                basing=data["basing"],
                ap_cost=data["apCost"],
                time_to_online=data["timeToOnline"],
                chain_roles=data["chainRoles"],
                regime_affinity=data["regimeAffinity"],
                applicable_effects=effector_to_effects.get(tid, []),
            )
        self.asset_templates = asset_templates

        mission_sets: dict[str, MissionSetTemplate] = {}
        for path in sorted((CONTENT_DIR / "missionSets").glob("*.json")):
            data = json.loads(path.read_text())
            mission_sets[data["missionSetId"]] = MissionSetTemplate(
                mission_set_id=data["missionSetId"],
                asset_type_ids=data["assetTypeIds"],
                king_regime_affinity=data["kingRegimeAffinity"],
            )
        self.mission_sets = mission_sets

    def get_asset_template(self, template_id: str) -> Optional[AssetTemplate]:
        return self.asset_templates.get(template_id)

    def get_mission_set(self, mission_set_id: str) -> Optional[MissionSetTemplate]:
        return self.mission_sets.get(mission_set_id)

    def get_effect(self, effect_id: str) -> Optional[EffectDefinition]:
        return self.effects.get(effect_id)
