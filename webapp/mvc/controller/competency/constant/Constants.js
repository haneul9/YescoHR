sap.ui.define(
  [
    'sap/ui/yesco/common/Validator', //
  ],
  function (Validator) {
    'use strict';

    return {
      LIST_PAGE: { ME: { route: 'competency', detail: 'competency-detail', id: 'container-ehr---competency' }, MA: { route: 'm/competency', detail: 'm/competency-detail', id: 'container-ehr---m_competency' } },
      REJECT_DIALOG_ID: 'sap.ui.yesco.mvc.view.competency.fragment.RejectDialog',

      TAB: { ABILITY: 'T01', OPINION: 'T02' },
      APPRAISER_TYPE: { ME: 'ME', MA: 'MA' },
      DISPLAY_TYPE: { EDIT: 'X', DISPLAY_ONLY: 'D', HIDE: 'H', HIDDEN_VALUE: 'V' },
      GOAL_TYPE: { COMMON: { code: '1', name: 'common' }, DUTY: { code: '2', name: 'duty' } },
      PROCESS_TYPE: { LIST: { code: 'L', label: 'LABEL_00177' }, DETAIL: { code: 'D', label: 'LABEL_00165' }, SAVE: { code: 'T', label: 'LABEL_00103' }, SEND: { code: 'C', label: 'LABEL_00175' }, APPROVE: { code: 'P', label: 'LABEL_00123' }, REJECT: { code: 'R', label: 'LABEL_00124' }, CANCEL: { code: 'W', label: 'LABEL_10048' }, COMPLETE: { code: 'P', label: 'LABEL_00117' }, CANCEL_COMPLETE: { code: 'W', label: 'LABEL_10049' } },

      REJECT_PROPERTIES: ['Rjctr', 'Rjctrin'],
      SUMMARY_PROPERTIES: ['D1z200', 'D1fapp', 'D2z200', 'D2fapp', 'HZ200', 'HFapp', 'Z200r', 'Fappr', 'Z209'],
      GOAL_PROPERTIES: ['Obj0', 'Z200', 'Fapp'],
      COMBO_PROPERTIES: ['Z200', 'Fapp'],

      VALIDATION_PROPERTIES: [
        { field: 'Z200', label: 'LABEL_10057', type: Validator.SELECT1 }, // 본인진단
        { field: 'Fapp', label: 'LABEL_10058', type: Validator.SELECT1 }, // 팀장진단
        { field: 'Z200r', label: 'LABEL_10053', type: Validator.INPUT1 }, // 역량진단 의견
        { field: 'Fappr', label: 'LABEL_10053', type: Validator.INPUT1 }, // 역량진단 의견
      ],

      // ABAP <-> WEB Mapping fields
      FIELD_MAPPING: {
        Obj0: ['Obj0'], // 목표
        Z209: ['Z209'], // 상시관리-진단자 코멘트
        Z200: ['Z200', 'D1z200', 'D2z200', 'HZ200', 'Z200r'], // 역량-본인진단, 공통역량 본인진단, 직무역량 본인진단, 본인진단 평균점수, 역량진단의견-진단대상자
        Fapp: ['Fapp', 'D1fapp', 'D2fapp', 'HFapp', 'Fappr'], // 역량-팀장진단, 공통역량 팀장진단, 직무역량 팀장진단, 팀장진단 평균점수, 역량진단의견-진단자
      },

      // Web custom control by FIELD_MAPPING base
      FIELD_STATUS_MAP: {
        2: {
          E: {},
        },
        4: {
          J: { Obj0: { ME: 'D' }, Z200: { MA: 'V' }, D1z200: { ME: 'D', MA: 'V' }, D2z200: { ME: 'D', MA: 'V' }, HZ200: { ME: 'D', MA: 'V' }, Z200r: { MA: 'V' }, Fapp: { ME: 'V' }, D1fapp: { ME: 'V' }, D2fapp: { ME: 'V' }, HFapp: { ME: 'V' }, Fappr: { ME: 'V' }, Z209: { MA: 'X' } },
          L: { Fapp: { ME: 'V' }, D1fapp: { ME: 'V', MA: 'D' }, D2fapp: { ME: 'V', MA: 'D' }, HFapp: { ME: 'V', MA: 'D' }, Fappr: { ME: 'V' } },
          O: { Fapp: { ME: 'V' }, D1fapp: { ME: 'V' }, D2fapp: { ME: 'V' }, HFapp: { ME: 'V' }, Fappr: { ME: 'V' } },
        },
        5: {
          X: { Z209: { ME: 'H' } },
        },
      },

      BUTTON_STATUS_MAP: {
        2: {
          E: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: 'X' } },
        },
        4: {
          J: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X' }, SAVE: { process: true, label: 'LABEL_00103', ME: 'X', MA: 'X' } },
          L: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: 'X' } },
          O: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X' }, SAVE: { process: true, label: 'LABEL_00103', ME: '', MA: '' } },
        },
        5: {
          X: { REJECT_REASON: { label: 'LABEL_00142', ME: 'X', MA: 'X' } },
        },
      },
    };
  }
);
