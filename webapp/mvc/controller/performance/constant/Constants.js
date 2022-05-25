sap.ui.define(
  [
    'sap/ui/yesco/common/Validator', //
  ],
  function (Validator) {
    'use strict';

    return {
      LIST_PAGE: [
        { type: 'ME', route: 'performance', detail: 'performance-detail', id: 'container-ehr---performance' },
        { type: 'ME', route: 'h/performance', detail: 'h/performance-detail', id: 'container-ehr---h_performance' },
        { type: 'MA', route: 'm/performancePry', detail: 'm/performancePry-detail', id: 'container-ehr---m_performancePry' },
        { type: 'MA', route: 'h/performancePry', detail: 'h/performancePry-detail', id: 'container-ehr---h_performancePry' },
        { type: 'MB', route: 'm/performanceSry', detail: 'm/performanceSry-detail', id: 'container-ehr---m_performanceSry' },
        { type: 'MB', route: 'h/performanceSry', detail: 'h/performanceSry-detail', id: 'container-ehr---h_performanceSry' },
      ],

      TAB: { GOAL: 'T01', OPINION: 'T02' },
      APPRAISER_TYPE: { ME: 'ME', MA: 'MA', MB: 'MB' },
      DISPLAY_TYPE: { EDIT: 'X', DISPLAY_ONLY: 'D', HIDE: 'H', HIDDEN_VALUE: 'V' },
      GOAL_TYPE: { STRATEGY: { code: '1', name: 'strategy' }, DUTY: { code: '2', name: 'duty' } },
      PROCESS_TYPE: { LIST: { code: 'L', label: 'LABEL_00177' }, DETAIL: { code: 'D', label: 'LABEL_00165' }, SAVE: { code: 'T', label: 'LABEL_00103' }, SEND: { code: 'C', label: 'LABEL_00175' }, APPROVE: { code: 'P', label: 'LABEL_00123' }, REJECT: { code: 'R', label: 'LABEL_00124' }, CANCEL: { code: 'W', label: 'LABEL_00118' }, CONFIRM: { code: 'C', label: 'LABEL_10043' }, COMPLETE: { code: 'C', label: 'LABEL_00117' }, SEARCH: { code: '1', label: 'LABEL_00100'}, DIALOG_SAVE: { code : '2', label: 'LABEL_00103' } },

      REJECT_PROPERTIES: ['Rjctr', 'Rjctrin'],
      OPPOSITION_PROPERTIES: ['Zzappid', 'Zdocid', 'Zzappee', 'Begda', 'Endda', 'Werks'],
      SUMMARY_PROPERTIES: ['Zmepoint', 'Zmapoint', 'Zmbgrade'],
      MANAGE_PROPERTIES: ['Z131', 'Z132', 'Z136', 'Z137', 'Z140', 'Papp1', 'Papp2', 'origin'],
      GOAL_PROPERTIES: ['Obj0', 'Fwgt', 'Z101', 'Z103', 'Z103s', 'Z109', 'Z111', 'Zapgme', 'Zapgma', 'Ztbegda', 'Ztendda', 'Zmarslt', 'Zrslt', 'Z1175', 'Z1174', 'Z1173', 'Z1172', 'Z1171', 'Z125Ee', 'Z125Er', 'origin'],
      COMBO_PROPERTIES: ['Zapgme', 'Zapgma', 'Z103s', 'Z111', 'Zmbgrade'],

      VALIDATION_PROPERTIES: [
        { field: 'Obj0', label: 'LABEL_10033', type: Validator.INPUT2 }, // 목표
        { field: 'Fwgt', label: 'LABEL_10021', type: Validator.INPUT2 }, // 가중치(%)
        { field: 'Zapgme', label: 'LABEL_10003', type: Validator.SELECT2 }, // 자기평가
        { field: 'Zapgma', label: 'LABEL_10022', type: Validator.SELECT2 }, // 1차평가
        { field: 'Z103s', label: 'LABEL_10023', type: Validator.SELECT2 }, // 연관 상위 목표
        { field: 'Ztbegda', label: 'LABEL_10024', type: Validator.INPUT1 }, // 목표수행 시작일
        { field: 'Ztendda', label: 'LABEL_10025', type: Validator.INPUT1 }, // 목표수행 종료일
        { field: 'Z111', label: 'LABEL_00261', type: Validator.SELECT2 }, // 진행상태
        { field: 'Zmarslt', label: 'LABEL_10027', type: Validator.INPUT2 }, // 핵심결과
        { field: 'Zrslt', label: 'LABEL_10028', type: Validator.INPUT1 }, // 실적
        { field: 'Z1175', label: 'LABEL_10029', type: Validator.INPUT1 }, // 달성방안
        { field: 'Z1174', label: 'LABEL_10029', type: Validator.INPUT1 }, // 달성방안
        { field: 'Z1173', label: 'LABEL_10029', type: Validator.INPUT1 }, // 달성방안
        { field: 'Z1172', label: 'LABEL_10029', type: Validator.INPUT1 }, // 달성방안
        { field: 'Z1171', label: 'LABEL_10029', type: Validator.INPUT1 }, // 달성방안
        { field: 'Zmepoint', label: 'LABEL_10012', type: Validator.INPUT2 }, // 자기 평가점수
        { field: 'Zmapoint', label: 'LABEL_10013', type: Validator.INPUT2 }, // 1차 평가점수
        { field: 'Zmbgrade', label: 'LABEL_10014', type: Validator.SELECT1 }, // 최종 평가등급
        { field: 'Z131', label: 'LABEL_10036', type: Validator.INPUT1 }, // 목표 수립 의견
        { field: 'Z132', label: 'LABEL_10036', type: Validator.INPUT1 }, // 목표 수립 의견
        { field: 'Z136', label: 'LABEL_10037', type: Validator.INPUT1 }, // 중간 점검 의견
        { field: 'Z137', label: 'LABEL_10037', type: Validator.INPUT1 }, // 중간 점검 의견
        { field: 'Papp1', label: 'LABEL_10038', type: Validator.INPUT2 }, // 성과 평가 의견
        { field: 'Papp2', label: 'LABEL_10038', type: Validator.INPUT2 }, // 성과 평가 의견
        // { field: 'Z109', label: 'LABEL_10026', type: Validator.INPUT2 }, // 진척도(%)
      ],

      // ABAP <-> WEB Mapping fields
      FIELD_MAPPING: {
        Z103: ['Z103s'], // 연관 상위 목표
        Z109: ['Z109'], // 진척도
        Z111: ['Z111'], // 진행상태
        Z131: ['Z131'], // 목표수립의견-대상자
        Z132: ['Z132'], // 목표수립의견-평가자
        Z136: ['Z136'], // 중간점검의견-대상자
        Z137: ['Z137'], // 중간점검의견-평가자
        Z140: ['Z140'], // 상시관리
        Fapp: ['Zmbgrade'], // 최종평가등급
        Z105: ['Ztbegda', 'Ztendda'], // 목표수행시작일-Ztbegda, 목표수행종료일-Ztbegda
        Z113: ['Zmarslt', 'Zrslt'], // Zmarslt-핵심결과, Zrslt-실적
        Z125: ['Z125Ee', 'Z125Er'], // 목표항목별의견(평가대상자)-Z125Ee, 목표항목별의견(평가자)-Z125Er
        Z117: ['Z1175', 'Z1174', 'Z1173', 'Z1172', 'Z1171'], // 달성수준 1,2,3,4,5
        Papp: ['Zapgme', 'Zapgma', 'Papp1', 'Papp2', 'Zmepoint', 'Zmapoint'], // 자기평가-Zapgme, 1차평가-Zapgma, 성과평가의견(대상자)-Papp1, 성과평가의견(평가자)-Papp2, 자기평가점수-Zmepoint, 1차평가점수-Zmapoint
      },

      // Web custom control by FIELD_MAPPING base
      FIELD_STATUS_MAP: {
        2: {
          A: { Zrslt: { ME: 'H', MA: 'H', MB: 'H' } },
          B: { Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z125Ee: { ME: 'X', MA: 'V', MB: 'V' }, Z125Er: { ME: 'D', MA: 'D', MB: 'D' }, Z131: { MA: 'V', MB: 'V' } },
          C: { Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z125Ee: { ME: 'D', MA: 'D', MB: 'D' }, Z125Er: { ME: 'V', MA: 'X', MB: 'V' }, Z132: { ME: 'V', MB: 'V' } },
          D: { Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z140: { MA: 'X' } },
        },
        3: {
          F: { Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z125Ee: { ME: 'X', MA: 'V', MB: 'V' }, Z125Er: { ME: 'D', MA: 'D', MB: 'D' }, Z136: { MA: 'V', MB: 'V' }, Z140: { MA: 'X' } },
          G: { Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z125Ee: { ME: 'D', MA: 'D', MB: 'D' }, Z125Er: { ME: 'V', MA: 'X', MB: 'V' }, Z137: { ME: 'V', MB: 'V' } },
          H: { Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z140: { MA: 'X' } },
        },
        4: {
          1: { Zapgme: { ME: 'X', MA: 'V', MB: 'V' }, Zapgma: { ME: 'H', MA: 'D', MB: 'V' }, Papp1: { ME: 'X', MA: 'V', MB: 'V' }, Papp2: { ME: 'V', MA: 'D', MB: 'V' }, Zmepoint: { ME: 'D', MA: 'V', MB: 'V' }, Zmapoint: { ME: 'H', MA: 'D', MB: 'V' }, Zmarslt: { ME: 'D', MA: 'D' }, Zrslt: { MA: 'V', MB: 'V' }, Z140: { MA: 'X' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'H' } },
          A: { Ztbegda: { ME: 'D' }, Ztendda: { ME: 'D' }, Z109: { ME: 'D' }, Z111: { ME: 'D' }, Zmarslt: { ME: 'D' }, Zrslt: { ME: 'D' }, Zapgme: { ME: 'D', MA: 'D', MB: 'D' }, Papp1: { ME: 'D', MA: 'D', MB: 'D' }, Zmepoint: { ME: 'D', MA: 'D', MB: 'D' }, Zapgma: { ME: 'H', MA: 'X', MB: 'V' }, Papp2: { ME: 'V', MA: 'X', MB: 'V' }, Zmapoint: { ME: 'H', MA: 'D', MB: 'V' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'H' } },
          B: { Ztbegda: { ME: 'D' }, Ztendda: { ME: 'D' }, Z109: { ME: 'D' }, Z111: { ME: 'D' }, Zmarslt: { ME: 'D' }, Zrslt: { ME: 'D' }, Zapgme: { ME: 'D', MA: 'D', MB: 'D' }, Papp1: { ME: 'D', MA: 'D', MB: 'D' }, Zmepoint: { ME: 'D', MA: 'D', MB: 'D' }, Zapgma: { ME: 'H', MA: 'D', MB: 'D' }, Papp2: { ME: 'D', MA: 'D', MB: 'D' }, Zmapoint: { ME: 'H', MA: 'D', MB: 'D' }, Z140: { MA: 'D' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'H' } },
          2: { Zapgme: { ME: 'D', MA: 'D', MB: 'D' }, Papp1: { ME: 'D', MA: 'D', MB: 'D' }, Zmepoint: { ME: 'D', MA: 'D', MB: 'D' }, Zapgma: { ME: 'H', MA: 'D', MB: 'D' }, Papp2: { ME: 'D', MA: 'D', MB: 'D' }, Zmapoint: { ME: 'H', MA: 'D', MB: 'D' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'X' } },
          K: { Zapgme: { ME: 'D', MA: 'D', MB: 'D' }, Papp1: { ME: 'D', MA: 'D', MB: 'D' }, Zmepoint: { ME: 'D', MA: 'D', MB: 'D' }, Zapgma: { ME: 'H', MA: 'D', MB: 'D' }, Papp2: { ME: 'D', MA: 'D', MB: 'D' }, Zmapoint: { ME: 'H', MA: 'D', MB: 'D' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'D' } },
          N: { Zapgma: { ME: 'H' }, Zmapoint: { ME: 'H' }, Zmbgrade: { MB: 'D' } },
        },
        5: {
          Q: { Zapgma: { ME: 'H' }, Zmapoint: { ME: 'H' }, Zmbgrade: { MA: 'H' } },
          R: { Zapgma: { ME: 'H' }, Zmapoint: { ME: 'H' }, Zmbgrade: { MA: 'H' } },
          X: { Zapgma: { ME: 'H' }, Zmapoint: { ME: 'H' }, Zmbgrade: { MA: 'H' } },
        },
      },

      BUTTON_STATUS_MAP: {
        2: {
          A: { REJECT_REASON: { label: 'LABEL_00142', ME: '', MA: '', MB: '' }, TOP_GOAL: { label: 'LABEL_10032', ME: '', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: '', MB: '' } },
          B: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: 'X', MA: '', MB: '' } },
          C: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: 'X', MB: '' } },
          D: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { label: 'LABEL_00103', ME: '', MA: 'X', MB: '' } },
        },
        3: {
          F: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: 'X', MA: 'X', MB: '' } },
          G: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: 'X', MB: '' } },
          H: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: 'X', MA: '', MB: '' }, SAVE: { label: 'LABEL_00103', ME: '', MA: 'X', MB: '' } },
        },
        4: {
          1: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: '', MA: '', MB: '' }, DIAGNOSIS: { label: 'LABEL_10034', ME: 'X', MA: '', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: 'X', MA: 'X', MB: '' } },
          A: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: '', MA: '', MB: '' }, DIAGNOSIS: { label: 'LABEL_10034', ME: 'X', MA: 'X', MB: '' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: 'X', MB: '' } },
          B: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: '', MA: '', MB: '' }, DIAGNOSIS: { label: 'LABEL_10034', ME: 'X', MA: 'X', MB: 'X' } },
          2: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: '', MA: '', MB: '' }, DIAGNOSIS: { label: 'LABEL_10034', ME: 'X', MA: 'X', MB: 'X' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: '', MB: 'X' }, COMPLETE: { standard: true, MB: '' } },
          K: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { label: 'LABEL_10032', ME: '', MA: '', MB: '' }, DIAGNOSIS: { label: 'LABEL_10034', ME: 'X', MA: 'X', MB: 'X' }, COMPLETE: { standard: true, MB: '' } },
          N: {},
        },
        5: {
          Q: {},
          R: { OPPO_VIEW: { label: 'LABEL_10044', ME: 'X' } },
          X: { OPPO_VIEW: { label: 'LABEL_10044', ME: 'X' } },
        },
      },
    };
  }
);
