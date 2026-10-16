// no useState needed — all state is owned by the parent
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import LoadingOverlay from "@/components/ui/loading-overplay";
import { ClassStudent, SkillEntry, StudentPerk } from "../pages/manageClass";

interface Role {
  id: string;
  label: string;
}

interface TableProps {
  student: ClassStudent[];
  originalStudents: ClassStudent[];
  roles: Role[];
  loading: boolean;
  readOnly?: boolean;
  onXpIncrease: (studentId: string) => void;
  onXpChange: (studentId: string, newXp: number) => void;
  onMsChange: (studentId: string, newMs: number) => void;
  onSkillChange: (studentId: string, skillId: string, newValue: number) => void;
  onCeoChange: (studentId: string, ceoId: string) => void;
  onToggleSkillLock: (studentId: string) => void;
  onToggleAllSkillLock: (unlock: boolean) => void;
  perkLoadingIds?: Set<string>;
  onPerkAction: (
    studentId: string,
    perk: StudentPerk,
    action: "unlock" | "approved" | "denied" | "reset",
  ) => void;
}

interface NumCellProps {
  value: number;
  disableMinus?: boolean;
  disablePlus?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  skillLocked?: boolean;
  editable?: boolean;
  onDirectChange?: (newValue: number) => void;
  min?: number;
  max?: number;
}

function NumCell({
  value,
  disableMinus,
  disablePlus,
  onIncrement,
  onDecrement,
  skillLocked,
  editable = false,
  onDirectChange,
  min = 0,
  max = 100,
}: NumCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value.toString());
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    const numValue = parseInt(trimmed, 10);

    if (trimmed === "" || isNaN(numValue)) {
      setEditValue(value.toString());
      setIsEditing(false);
      return;
    }

    const clampedValue = Math.max(min, Math.min(max, numValue));

    if (onDirectChange && clampedValue !== value) {
      onDirectChange(clampedValue);
    }

    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === "" || /^-?\d*$/.test(newValue)) {
      setEditValue(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(value.toString());
    }
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Enter",
      "Escape",
    ];
    const isNumber = /^\d$/.test(e.key);
    const isMinus = e.key === "-" && editValue === "";

    if (!isNumber && !isMinus && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div
      className={`flex items-center justify-center ${skillLocked ? "opacity-90 cursor-not-allowed" : ""}`}
      aria-disabled={skillLocked}
    >
      <button
        onClick={onDecrement}
        disabled={disableMinus || skillLocked}
        className="w-5 h-6 flex items-center justify-center bg-[#1a1a1a] border border-gray-700 text-green-500 hover:border-green-600 transition-colors rounded-l-sm disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus className="w-2.5 h-2.5" />
      </button>

      {editable && isEditing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={editValue}
          onChange={handleChange}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-10 h-6 flex items-center justify-center bg-[#0d1117] border-y border-gray-700 text-xs text-white font-mono text-center focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      ) : (
        <span
          onClick={() => editable && !skillLocked && setIsEditing(true)}
          className={`w-10 h-6 flex items-center justify-center bg-[#0d1117] border-y border-gray-700 text-xs text-white font-mono ${
            editable && !skillLocked ? "cursor-pointer hover:bg-[#1a1a1a]" : ""
          }`}
          title={editable ? "Click to edit" : undefined}
        >
          {value}
        </span>
      )}

      <button
        onClick={onIncrement}
        disabled={disablePlus || skillLocked}
        className="w-5 h-6 flex items-center justify-center bg-[#1a1a1a] border border-gray-700 text-green-500 hover:border-green-600 transition-colors rounded-r-sm disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

function CeoCell({
  studentId,
  value,
  roles,
  onCeoChange,
  isAssigning,
}: {
  studentId: string;
  value?: string;
  roles: Role[];
  onCeoChange: (studentId: string, ceoId: string) => void;
  isAssigning?: boolean;
}) {
  return (
    <Select
      value={value ?? ""}
      onValueChange={(v) => {
        if (v !== value && !isAssigning) onCeoChange(studentId, v);
      }}
      disabled={isAssigning}
    >
      <SelectTrigger className="h-7 w-32 text-[10px] bg-transparent border-0 border-b border-gray-600 rounded-none text-green-400 focus:ring-0 focus:border-green-500 px-0">
        <SelectValue placeholder="Choose role..." />
      </SelectTrigger>
      <SelectContent className="z-[2100] bg-[#0d1117] border-gray-700">
        {roles.map((role) => (
          <SelectItem
            key={`${studentId}-${role.id}`}
            value={role.id}
            className="text-sm text-gray-300 focus:bg-[#0f2a0f] focus:text-green-400"
          >
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Color map by perk_status
function perkColors(perk: StudentPerk): { border: string; text: string } {
  if (!perk.is_unlocked)
    return { border: "border-gray-800", text: "text-gray-700" };
  if (perk.perk_status === "pending")
    return { border: "border-yellow-600", text: "text-yellow-400" };
  if (perk.perk_status === "approved")
    return { border: "border-green-600", text: "text-green-400" };
  if (perk.perk_status === "denied")
    return { border: "border-red-700", text: "text-red-500" };
  if (perk.is_used) return { border: "border-gray-700", text: "text-gray-500" };
  // unlocked but not yet activated
  return { border: "border-gray-500", text: "text-white" };
}

function PerkBadge({
  perk,
  studentId,
  onPerkAction,
}: {
  perk: StudentPerk;
  studentId: string;
  onPerkAction: (
    studentId: string,
    perk: StudentPerk,
    action: "unlock" | "approved" | "denied" | "reset",
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const { border, text } = perkColors(perk);
  const isPending = perk.perk_status === "pending";

  // Recalculate position whenever popup opens
  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPopupPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX,
      });
    }
  }, [open]);

  const popup =
    open &&
    createPortal(
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setOpen(false)}
        />
        {/* Popup — anchored via fixed position to escape all overflow contexts */}
        <div
          className="fixed z-[9999] bg-[#0d1117] border border-gray-700 shadow-xl p-3 min-w-[130px]"
          style={{
            top: popupPos.top,
            left: popupPos.left,
            transform: "translateX(-100%)",
          }}
        >
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 truncate">
            {perk.title}
          </p>

          {/* Unlock — only when locked */}
          {!perk.is_unlocked && (
            <button
              onClick={() => {
                onPerkAction(studentId, perk, "unlock");
                setOpen(false);
              }}
              className="w-full text-left px-2 py-1 text-[10px] font-bold text-green-400 hover:bg-green-900/30 uppercase tracking-widest"
            >
              Unlock
            </button>
          )}

          {/* Approve / Deny — only when pending */}
          {isPending && (
            <>
              <button
                onClick={() => {
                  onPerkAction(studentId, perk, "approved");
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1 text-[10px] font-bold text-green-400 hover:bg-green-900/30 uppercase tracking-widest"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  onPerkAction(studentId, perk, "denied");
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1 text-[10px] font-bold text-red-500 hover:bg-red-900/30 uppercase tracking-widest"
              >
                Deny
              </button>
            </>
          )}

          {/* Status label when no actions available */}
          {perk.is_unlocked &&
            !isPending &&
            !perk.is_used &&
            perk.perk_status !== "approved" && (
              <p className="px-2 py-1 text-[9px] text-gray-500 uppercase">
                {perk.perk_status ?? "unlocked"}
              </p>
            )}

          {/* Reset — when approved or used */}
          {(perk.perk_status === "approved" || perk.is_used) && (
            <>
              <p className="px-2 py-1 text-[9px] text-gray-600 uppercase">
                {perk.is_used ? "Used" : "Approved"}
              </p>
              <button
                onClick={() => {
                  onPerkAction(studentId, perk, "reset");
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1 text-[10px] font-bold text-blue-400 hover:bg-blue-900/30 uppercase tracking-widest flex items-center gap-1"
              >
                ↺ Reset
              </button>
            </>
          )}
        </div>
      </>,
      document.body,
    );

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        disabled={false}
        className={`relative w-full px-1 py-0.5 text-[10px] font-bold border uppercase text-center truncate transition-colors hover:opacity-80 ${border} ${text} ${perk.is_used ? "opacity-40 cursor-not-allowed" : ""}`}
        title={perk.description ?? undefined}
      >
        {perk.title}
      </button>
      {isPending && (
        <div className="absolute top-0 -right-1 z-10">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-red-500"></span>
          </span>
        </div>
      )}
      {popup}
    </div>
  );
}

const SKILL_ORDER = [
  "team",
  "quality",
  "marketing",
  "logistics",
  "innovation",
] as const;

const TableManageClass = ({
  student,
  originalStudents,
  roles,
  onXpIncrease,
  onXpChange,
  onMsChange,
  onSkillChange,
  onCeoChange,
  onToggleSkillLock,
  onToggleAllSkillLock,
  perkLoadingIds,
  onPerkAction,
  loading,
  readOnly = false,
}: TableProps) => {
  const allUnlocked =
    student.length > 0 && student.every((s) => s.skill_unlocked);

  return (
    <div className={`overflow-x-auto relative bg-[#0E1829] ${readOnly ? "pointer-events-none select-none opacity-75" : ""}`}>
      <table className="text-left border-separate border-spacing-0 min-w-[1200px] w-full">
        <thead className="bg-[#0E1829]">
          <tr>
            <th className="sticky left-0 z-20 bg-[#0E1829] p-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase border-b border-gray-800 w-12">
              <Switch
                checked={allUnlocked}
                onCheckedChange={(val) => onToggleAllSkillLock(val)}
              />
            </th>
            <th className="sticky left-[65px] z-20 bg-[#0E1829] p-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase border-b border-gray-800 w-32">
              NAME
            </th>
            <th className="sticky left-[188px] z-20 bg-[#0E1829] p-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase border-b border-gray-800 w-32">
              CEO
            </th>
            {[
              "LVL",
              "XP",
              "MS",
              "TEAM",
              "QUALITY",
              "MARKETING",
              "LOGISTICS",
              "INNOVATION",
            ].map((col) => (
              <th
                key={col}
                className="p-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase border-b border-gray-800 text-center"
              >
                {col}
              </th>
            ))}
            <th className="sticky right-0 z-20 bg-[#0E1829] p-2 text-[10px] font-bold tracking-widest text-gray-500 uppercase border-b border-gray-800 text-center w-60">
              PERKS
            </th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="h-[150px]">
              <td colSpan={12} className="text-center py-4 text-gray-400">
                <LoadingOverlay />
              </td>
            </tr>
          ) : (
            <>
              {student.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="text-center py-4 text-gray-400 text-sm"
                  >
                    No students found.
                  </td>
                </tr>
              ) : (
                <>
                  {student.map((s) => {
                    const xp = s.xp ?? 0;
                    const ms = s.ms ?? 0;
                    // Find original XP value for this student
                    const originalStudent = originalStudents.find((orig) => orig.id === s.id);
                    const originalXp = originalStudent?.xp ?? 0;
                    
                    return (
                      <tr
                        key={s.id}
                        className="bg-[#171E24] border-b border-gray-800 hover:bg-[#0f1f0f] transition-colors min-h-40"
                      >
                        {/* Unlock switch */}
                        <td className="sticky left-0 z-10 bg-[#171E24] p-2 text-center">
                          <Switch
                            checked={s.skill_unlocked ?? false}
                            onCheckedChange={() => onToggleSkillLock(s.id)}
                          />
                        </td>

                        {/* Name */}
                        <td className="sticky left-[65px] z-10 bg-[#171E24] p-2 text-xs text-white font-semibold whitespace-nowrap w-32 truncate">
                          {s.name ?? "Unnamed student"}
                        </td>

                        {/* CEO */}
                        <td className="sticky left-[188px] z-10 bg-[#171E24] p-1 w-32">
                          <CeoCell
                            studentId={s.id}
                            value={s.ceo?.id}
                            roles={roles}
                            onCeoChange={onCeoChange}
                            isAssigning={perkLoadingIds?.has(s.id)}
                          />
                        </td>

                        {/* Level */}
                        <td className="p-1 text-center">
                          <span className="w-10 h-6 inline-flex items-center justify-center bg-[#0d1117] border border-gray-700 text-xs text-white font-mono">
                            {s.level || 1}
                          </span>
                        </td>

                        {/* XP */}
                        <td className="p-1">
                          <NumCell
                            value={xp}
                            disableMinus={!s.ceo?.id || xp <= originalXp}
                            disablePlus={!s.ceo?.id || xp >= 40}
                            onIncrement={() => onXpIncrease(s.id)}
                            onDecrement={() => {
                              if (xp > originalXp) {
                                onXpChange(s.id, xp - 1);
                              }
                            }}
                            editable={!!s.ceo?.id}
                            onDirectChange={(newValue) => {
                              if (newValue >= originalXp && newValue <= 40) {
                                onXpChange(s.id, newValue);
                              }
                            }}
                            min={originalXp}
                            max={40}
                          />
                        </td>

                        {/* Market Share */}
                        <td className="p-1">
                          <NumCell
                            value={ms}
                            disableMinus={ms <= 0}
                            disablePlus={ms >= 100}
                            onIncrement={() => onMsChange(s.id, ms + 1)}
                            onDecrement={() => onMsChange(s.id, ms - 1)}
                            editable={true}
                            onDirectChange={(newValue) =>
                              onMsChange(s.id, newValue)
                            }
                            min={0}
                            max={100}
                          />
                        </td>

                        {/* Skills */}
                        {SKILL_ORDER.map((skillName) => {
                          const skill: SkillEntry | undefined =
                            s.skillEntries?.find(
                              (sk) => sk.label.toLowerCase() === skillName,
                            );
                          const val = skill?.value ?? 0;
                          const locked = !s.skill_unlocked;
                          return (
                            <td
                              key={skillName}
                              className={`p-1 ${locked ? "opacity-40" : ""}`}
                            >
                              <NumCell
                                value={val}
                                disableMinus={locked || !skill || val <= 0}
                                disablePlus={locked || !skill || val >= 8}
                                skillLocked={locked}
                                onIncrement={() =>
                                  !locked &&
                                  skill &&
                                  onSkillChange(s.id, skill.id, val + 1)
                                }
                                onDecrement={() =>
                                  !locked &&
                                  skill &&
                                  onSkillChange(s.id, skill.id, val - 1)
                                }
                              />
                            </td>
                          );
                        })}

                        {/* Perks */}
                        <td className="sticky right-0 z-10 bg-[#171E24] p-2 w-60">
                          {perkLoadingIds?.has(s.id) ? (
                            <div className="flex items-center justify-center gap-1.5 h-8">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-bounce" />
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-1">
                              {!s.ceo?.id ? (
                                <div className="col-span-2 text-[11px] text-gray-500 text-center">
                                  Please select a Ceo
                                </div>
                              ) : s.perks && s.perks.length === 0 ? (
                                <div className="col-span-2 text-[11px] text-gray-500 text-center">
                                  No perks
                                </div>
                              ) : (
                                <>
                                  {(s.perks ?? []).map((p) => (
                                    <PerkBadge
                                      key={p.id}
                                      perk={p}
                                      studentId={s.id}
                                      onPerkAction={onPerkAction}
                                    />
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TableManageClass;
