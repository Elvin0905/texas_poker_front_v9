export const VOICE_ASSET_LIST = [
  { key: "voice_allin", path: "assets/variants/test_style/audio/voice/allin.mp3" },
  { key: "voice_award", path: "assets/variants/test_style/audio/voice/award.mp3" },
  { key: "voice_bet", path: "assets/variants/test_style/audio/voice/bet.mp3" },
  { key: "voice_call", path: "assets/variants/test_style/audio/voice/call.mp3" },
  { key: "voice_check", path: "assets/variants/test_style/audio/voice/check.mp3" },
  { key: "voice_flush", path: "assets/variants/test_style/audio/voice/flush.mp3" },
  { key: "voice_flop", path: "assets/variants/test_style/audio/voice/flop.mp3" },
  { key: "voice_fold", path: "assets/variants/test_style/audio/voice/fold.mp3" },
  { key: "voice_four_of_a_kind", path: "assets/variants/test_style/audio/voice/four_of_a_kind.mp3" },
  { key: "voice_full_house", path: "assets/variants/test_style/audio/voice/full_house.mp3" },
  { key: "voice_high_card", path: "assets/variants/test_style/audio/voice/high_card.mp3" },
  { key: "voice_new_player", path: "assets/variants/test_style/audio/voice/new_player.mp3" },
  { key: "voice_new_round", path: "assets/variants/test_style/audio/voice/new_round.mp3" },
  { key: "voice_one_pair", path: "assets/variants/test_style/audio/voice/one_pair.mp3" },
  { key: "voice_raise", path: "assets/variants/test_style/audio/voice/raise.mp3" },
  { key: "voice_river", path: "assets/variants/test_style/audio/voice/river.mp3" },
  { key: "voice_royal_flush", path: "assets/variants/test_style/audio/voice/royal_flush.mp3" },
  { key: "voice_showdown", path: "assets/variants/test_style/audio/voice/showdown.mp3" },
  { key: "voice_straight", path: "assets/variants/test_style/audio/voice/straight.mp3" },
  { key: "voice_straight_flush", path: "assets/variants/test_style/audio/voice/straight_flush.mp3" },
  { key: "voice_three_of_a_kind", path: "assets/variants/test_style/audio/voice/three_of_a_kind.mp3" },
  { key: "voice_turn", path: "assets/variants/test_style/audio/voice/turn.mp3" },
  { key: "voice_two_pair", path: "assets/variants/test_style/audio/voice/two_pair.mp3" },
];

const ACTION_VOICE_KEY = {
  fold: "voice_fold",
  check: "voice_check",
  call: "voice_call",
  raise: "voice_raise",
  bet: "voice_bet",
  allin: "voice_allin",
  call_timeout: "voice_call",
  check_timeout: "voice_check",
  fold_timeout: "voice_fold",
  fold_disconnect: "voice_fold",
};

const PACKET_VOICE_KEY = {
  award: "voice_award",
  showdown: "voice_showdown",
  table_player_joined: "voice_new_player",
  hand_start: "voice_new_round",
};

const HAND_RANK_VOICE_KEY = {
  high_card: "voice_high_card",
  one_pair: "voice_one_pair",
  two_pair: "voice_two_pair",
  three_of_a_kind: "voice_three_of_a_kind",
  straight: "voice_straight",
  flush: "voice_flush",
  full_house: "voice_full_house",
  four_of_a_kind: "voice_four_of_a_kind",
  straight_flush: "voice_straight_flush",
  royal_flush: "voice_royal_flush",
};
const VOICE_KEY_SET = new Set(VOICE_ASSET_LIST.map((item) => item.key));

export function resolveVoiceKeyByPacket(packet) {
  const type = String(packet?.type || "");
  const data = packet?.data || {};

  if (type === "player_action") {
    return ACTION_VOICE_KEY[String(data.action || "").toLowerCase()] || null;
  }

  if (type === "deal_community") {
    const round = String(data.round || "").toLowerCase();
    if (round === "flop") {
      return "voice_flop";
    }
    if (round === "turn") {
      return "voice_turn";
    }
    if (round === "river") {
      return "voice_river";
    }
    return null;
  }

  return PACKET_VOICE_KEY[type] || null;
}

export function resolveVoiceKeyByHandRank(handRankRaw) {
  const handRank = String(handRankRaw || "").toLowerCase();
  if (!handRank) {
    return null;
  }
  const directKey = `voice_${handRank}`;
  if (VOICE_KEY_SET.has(directKey)) {
    return directKey;
  }
  return HAND_RANK_VOICE_KEY[handRank] || null;
}

