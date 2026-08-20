import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { tabulaStore } from "../lib/store";

export const JudgeScoringPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const eventId = searchParams.get("eventId") || "";
  const rooms = tabulaStore.getRooms(eventId);
  const room = rooms.find((r) => r.id === roomId);
  const speakers = tabulaStore.getSpeakers(eventId);
  const governmentSpeakers = speakers.filter(
    (speaker) => speaker.teamId === room?.governmentTeamId,
  );
  const oppositionSpeakers = speakers.filter(
    (speaker) => speaker.teamId === room?.oppositionTeamId,
  );
  const round = tabulaStore
    .getRounds(eventId)
    .find((item) => item.id === room?.roundId);

  const user = tabulaStore.getCurrentUser();

  // Ballot State
  const [govSpeaker1, setGovSpeaker1] = useState(0);
  const [govSpeaker2, setGovSpeaker2] = useState(0);
  const [oppSpeaker1, setOppSpeaker1] = useState(0);
  const [oppSpeaker2, setOppSpeaker2] = useState(0);

  const [winnerTeam, setWinnerTeam] = useState<"government" | "opposition">(
    "government",
  );
  const [justification, setJustification] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const govTotal = Number(govSpeaker1) + Number(govSpeaker2);
  const oppTotal = Number(oppSpeaker1) + Number(oppSpeaker2);

  const handleSubmitBallot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (
        !room ||
        !eventId ||
        governmentSpeakers.length < 2 ||
        oppositionSpeakers.length < 2
      ) {
        throw new Error(
          "This room does not have enough database-linked speakers to submit a ballot.",
        );
      }

      const winningTeamId =
        winnerTeam === "government"
          ? room.governmentTeamId
          : room.oppositionTeamId;

      const payload = {
        debateRoomId: room.id,
        eventId,
        roundNumber: round?.roundNumber || 1,
        judgeId: user.id,
        judgeName: user.fullName,
        winningTeamId,
        governmentTotalPoints: govTotal,
        oppositionTotalPoints: oppTotal,
        speakerScores: [
          {
            speakerId: governmentSpeakers[0].id,
            speakerName: governmentSpeakers[0].name,
            teamId: room.governmentTeamId,
            scores: { score: Number(govSpeaker1) },
            totalScore: Number(govSpeaker1),
          },
          {
            speakerId: governmentSpeakers[1].id,
            speakerName: governmentSpeakers[1].name,
            teamId: room.governmentTeamId,
            scores: { score: Number(govSpeaker2) },
            totalScore: Number(govSpeaker2),
          },
          {
            speakerId: oppositionSpeakers[0].id,
            speakerName: oppositionSpeakers[0].name,
            teamId: room.oppositionTeamId,
            scores: { score: Number(oppSpeaker1) },
            totalScore: Number(oppSpeaker1),
          },
          {
            speakerId: oppositionSpeakers[1].id,
            speakerName: oppositionSpeakers[1].name,
            teamId: room.oppositionTeamId,
            scores: { score: Number(oppSpeaker2) },
            totalScore: Number(oppSpeaker2),
          },
        ],
        generalComments: justification,
      };

      const res = await fetch("/api/ballots/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tabulaStore.getApiAuthHeaders() || {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        tabulaStore.submitBallot(payload);
        setIsSubmitted(true);
      } else {
        alert(data.error || "Ballot validation failed.");
      }
    } catch (err) {
      alert("Error connecting to ballot verification server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 my-6 px-4 font-sans text-[#33323A]">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/tabulation/live?eventId=${eventId}`)}
          className="flex items-center space-x-1.5 text-xs text-[#74727C] hover:text-[#33323A]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Live Tab</span>
        </button>
        <span className="text-xs text-[#74727C] font-mono">
          Ballot Verification Protocol
        </span>
      </div>

      <div className="bg-white border border-[#E5E4E8] rounded-md p-6 space-y-6">
        <div className="border-b border-[#E5E4E8] pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-[#33323A]">
              {room?.roomName || "Room not found"} - Official Judge Ballot
            </h1>
            <span className="px-2.5 py-1 bg-[#FAFAFB] text-[#74727C] border border-[#E5E4E8] text-xs font-semibold rounded">
              Round {round?.roundNumber ?? "-"}
            </span>
          </div>
          <p className="text-xs text-[#74727C] mt-1">
            Adjudicator:{" "}
            <span className="font-semibold text-[#33323A]">
              {user.fullName}
            </span>{" "}
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-3 bg-[#EBF7F0] border border-[#BDE7CE] rounded-md">
            <CheckCircle2 className="w-8 h-8 text-[#36A269] mx-auto" />
            <h2 className="text-base font-semibold text-[#247346]">
              Ballot Verified & Locked
            </h2>
            <p className="text-xs text-[#36A269] max-w-md mx-auto">
              Your official judge ballot has been cryptographically validated,
              stored, and integrated into the tabulation server engine.
            </p>
            <button
              onClick={() => navigate(`/tabulation/live?eventId=${eventId}`)}
              className="mt-2 px-4 py-2 bg-[#261B3D] text-white text-xs font-medium rounded-md"
            >
              Back to Live Tab
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitBallot} className="space-y-6 text-xs">
            {/* Government Team Section */}
            <div className="p-4 bg-[#FAFAFB] border border-[#E5E4E8] rounded-md space-y-3">
              <div className="flex justify-between items-center border-b border-[#E5E4E8] pb-2">
                <span className="font-semibold text-[#33323A] text-sm">
                  Government Team:{" "}
                  {room?.governmentTeamName || "Government team not configured"}
                </span>
                <span className="text-xs font-bold text-[#3F6FD9]">
                  Total: {govTotal.toFixed(1)} pts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#74727C] mb-1">
                    Speaker 1 Score (50 - 100)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={50}
                    max={100}
                    required
                    value={govSpeaker1}
                    onChange={(e) => setGovSpeaker1(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-[#E5E4E8] rounded-md text-[#33323A] font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#74727C] mb-1">
                    Speaker 2 Score (50 - 100)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={50}
                    max={100}
                    required
                    value={govSpeaker2}
                    onChange={(e) => setGovSpeaker2(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-[#E5E4E8] rounded-md text-[#33323A] font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Opposition Team Section */}
            <div className="p-4 bg-[#FAFAFB] border border-[#E5E4E8] rounded-md space-y-3">
              <div className="flex justify-between items-center border-b border-[#E5E4E8] pb-2">
                <span className="font-semibold text-[#33323A] text-sm">
                  Opposition Team:{" "}
                  {room?.oppositionTeamName || "Opposition team not configured"}
                </span>
                <span className="text-xs font-bold text-[#3F6FD9]">
                  Total: {oppTotal.toFixed(1)} pts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#74727C] mb-1">
                    Speaker 1 Score (50 - 100)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={50}
                    max={100}
                    required
                    value={oppSpeaker1}
                    onChange={(e) => setOppSpeaker1(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-[#E5E4E8] rounded-md text-[#33323A] font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#74727C] mb-1">
                    Speaker 2 Score (50 - 100)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min={50}
                    max={100}
                    required
                    value={oppSpeaker2}
                    onChange={(e) => setOppSpeaker2(Number(e.target.value))}
                    className="w-full h-9 px-3 bg-white border border-[#E5E4E8] rounded-md text-[#33323A] font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Winner Decision */}
            <div>
              <label className="block font-semibold text-[#33323A] mb-1.5">
                Official Verdict / Decision
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="winner"
                    value="government"
                    checked={winnerTeam === "government"}
                    onChange={() => setWinnerTeam("government")}
                    className="text-[#3F6FD9]"
                  />
                  <span>Government Win ({room?.governmentTeamName})</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="winner"
                    value="opposition"
                    checked={winnerTeam === "opposition"}
                    onChange={() => setWinnerTeam("opposition")}
                    className="text-[#3F6FD9]"
                  />
                  <span>Opposition Win ({room?.oppositionTeamName})</span>
                </label>
              </div>
            </div>

            {/* Justification Notes */}
            <div>
              <label className="block font-semibold text-[#33323A] mb-1">
                Judge Verbal Justification & RFD Notes
              </label>
              <textarea
                rows={3}
                required
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="w-full p-3 bg-[#FAFAFB] border border-[#E5E4E8] rounded-md text-[#33323A]"
              />
            </div>

            <div className="border-t border-[#E5E4E8] pt-4 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-[11px] text-[#74727C]">
                <ShieldCheck className="w-4 h-4 text-[#36A269]" />
                <span>Score validation enforced server-side.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#E51B4B] hover:bg-[#CC1641] text-white font-semibold rounded-md flex items-center space-x-1.5 shadow-none"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {isSubmitting
                    ? "Verifying..."
                    : "Submit & Lock Official Ballot"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
