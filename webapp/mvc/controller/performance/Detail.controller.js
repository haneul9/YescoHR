sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/Validator',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    MessageBox,
    AppUtils,
    ComboEntry,
    Client,
    UI5Error,
    ServiceNames,
    Validator,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.Detail', {
      LIST_PAGE_ID: 'container-ehr---performance',

      APPRAISER_TYPE: { ME: 'ME', MA: 'MA', MB: 'MB' },
      DISPLAY_TYPE: { EDIT: 'X', DISPLAY_ONLY: 'D', HIDE: 'H', HIDDEN_VALUE: 'V' },
      GOAL_TYPE: { STRATEGY: { code: '1', name: 'strategy' }, DUTY: { code: '2', name: 'duty' } },

      SUMMARY_PROPERTIES: ['Zmepoint', 'Zmapoint', 'Zmbgrade', 'Rjctr', 'Rjctrin'],
      MANAGE_PROPERTIES: ['Z131', 'Z132', 'Z136', 'Z137', 'Z140', 'Papp1', 'Papp2'],
      GOAL_PROPERTIES: ['Obj0', 'Fwgt', 'Z103', 'Z103s', 'Z109', 'Z111', 'Zapgme', 'Zapgma', 'Ztbegda', 'Ztendda', 'Zmarslt', 'Zrslt', 'Z1175', 'Z1174', 'Z1173', 'Z1172', 'Z1171', 'Z125Ee', 'Z125Er'],
      COMBO_PROPERTIES: ['Zapgme', 'Zapgma', 'Z103s', 'Z111', 'Zmbgrade'],

      BUTTON_STATUS_MAP: {
        2: {
          A: { REJECT_REASON: { ME: '', MA: '', MB: '' }, TOP_GOAL: { ME: '', MA: '', MB: '' }, SAVE: { ME: '', MA: '', MB: '' } },
          B: { REJECT_REASON: { ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { ME: 'X', MA: '', MB: '' }, SAVE: { ME: 'X', MA: 'X', MB: '' } },
          C: { REJECT_REASON: { ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { ME: 'X', MA: '', MB: '' }, SAVE: { ME: '', MA: 'X', MB: '' } },
          D: { REJECT_REASON: { ME: 'X', MA: 'X', MB: 'X' }, TOP_GOAL: { ME: 'X', MA: '', MB: '' }, SAVE: { ME: '', MA: 'X', MB: '' } },
        },
      },

      FIELD_STATUS_MAP: {
        2: {
          A: { Zmepoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmapoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'H' }, Zrslt: { ME: 'H', MA: 'H', MB: 'H' } },
          B: { Zmepoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmapoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'H' }, Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z125Ee: { ME: 'X', MA: 'V', MB: 'V' }, Z125Er: { ME: 'D', MA: 'D', MB: 'D' }, Z131: { MA: 'V', MB: 'V' } },
          C: { Zmepoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmapoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'H' }, Zrslt: { ME: 'H', MA: 'H', MB: 'H' }, Z125Ee: { ME: 'D', MA: 'D', MB: 'D' }, Z125Er: { ME: 'V', MA: 'X', MB: 'V' }, Z132: { ME: 'V', MB: 'V' } },
          D: { Zmepoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmapoint: { ME: 'H', MA: 'H', MB: 'H' }, Zmbgrade: { ME: 'H', MA: 'H', MB: 'H' }, Zrslt: { ME: 'H', MA: 'H', MB: 'H' } },
        },
      },

      VALIDATION_PROPERTIES: [
        { field: 'Obj0', label: 'LABEL_10033', type: Validator.INPUT2 }, // 목표
        { field: 'Fwgt', label: 'LABEL_10033', type: Validator.INPUT2 }, // 가중치
        { field: 'Zapgme', label: 'LABEL_10003', type: Validator.SELECT2 }, // 자기평가
        { field: 'Zapgma', label: 'LABEL_10022', type: Validator.SELECT2 }, // 1차평가
        { field: 'Z103s', label: 'LABEL_10023', type: Validator.SELECT2 }, // 연관 상위 목표
        { field: 'Ztbegda', label: 'LABEL_10024', type: Validator.INPUT1 }, // 목표수행 시작일
        { field: 'Ztendda', label: 'LABEL_10025', type: Validator.INPUT1 }, // 목표수행 종료일
        { field: 'Z109', label: 'LABEL_10026', type: Validator.INPUT2 }, // 진척도
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
      ],

      getPreviousRouteName() {
        return 'performance';
      },

      initializeFieldsControl(acc, cur) {
        return { ...acc, [cur]: this.DISPLAY_TYPE.EDIT };
      },

      initializeGoalItem(obj, index) {
        return {
          rootPath: _.chain(this.GOAL_TYPE).findKey({ code: obj.Z101 }).toLower().value(),
          expanded: false,
          isSaved: true,
          OrderNo: String(index),
          ItemNo: String(index + 1),
          ...obj,
          ..._.chain(this.COMBO_PROPERTIES)
            .reduce((acc, cur) => ({ ...acc, [cur]: _.isEmpty(obj[cur]) ? 'ALL' : obj[cur] }), {})
            .value(),
        };
      },

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          param: {},
          type: '',
          year: moment().format('YYYY'),
          tab: { selectedKey: 'T01' },
          stage: {
            headers: [],
            rows: [],
          },
          entry: {
            levels: [],
            topGoals: [],
            grades: [],
            status: [],
          },
          manage: {},
          summary: {},
          buttons: {
            submit: {
              TOP_GOAL: { Availability: '' },
              REJECT_REASON: { Availability: '' },
              SAVE: { Availability: '', ButtonText: this.getBundleText('LABEL_00103') }, // 저장
              Z_SUBMIT: { Availability: '' },
              APPROVE: { Availability: '' },
              REJECT: { Availability: '' },
              Z_CANCEL: { Availability: '' },
            },
            Rjctr: '',
            Rjctrin: '',
            isRejectProcess: false,
          },
          currentItemsLength: 0,
          fieldControl: {
            display: _.assignIn(_.reduce(this.GOAL_PROPERTIES, this.initializeFieldsControl.bind(this), {}), _.reduce(this.SUMMARY_PROPERTIES, this.initializeFieldsControl.bind(this), {}), _.reduce(this.MANAGE_PROPERTIES, this.initializeFieldsControl.bind(this), {})),
            limit: {},
          },
          goals: {
            valid: [],
            strategy: [],
            duty: [],
          },
        });
        this.setViewModel(oViewModel);

        this.renderStageClass();
      },

      async onObjectMatched(oParameter) {
        const oView = this.getView();
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
        const { type: sType, year: sYear } = oParameter;

        try {
          if (_.isEmpty(oListView) || _.isEmpty(oListView.getModel().getProperty('/parameter/rowData'))) {
            throw new UI5Error({ code: 'E', message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
          }

          const mParameter = _.omit(_.cloneDeep(oListView.getModel().getProperty('/parameter/rowData')), '__metadata');
          const { Zzapsts: sZzapsts, ZzapstsSub: sZzapstsSub } = _.pick(mParameter, ['Zzapsts', 'ZzapstsSub']);

          oViewModel.setProperty('/busy', true);
          oViewModel.setProperty('/type', sType);
          oViewModel.setProperty('/year', sYear);
          oViewModel.setProperty('/param', { ...mParameter });

          const fCurriedGetEntitySet = Client.getEntitySet(oModel);
          const [aStepList, aTopGoals, aStatus, aGrades, mDetailData] = await Promise.all([
            fCurriedGetEntitySet('AppStatusStepList', { Zzappid: mParameter.Zzappid }),
            fCurriedGetEntitySet('RelaUpTarget', { Zzappee: mParameter.Zzappee }),
            fCurriedGetEntitySet('AppValueList'),
            fCurriedGetEntitySet('AppGradeList'),
            Client.deep(oModel, 'AppraisalDoc', {
              ...mParameter,
              Menid: this.getCurrentMenuId(),
              Prcty: 'D',
              Zzappgb: sType,
              AppraisalDocDetailSet: [],
              AppraisalBottnsSet: [],
              AppraisalScreenSet: [],
            }),
          ]);

          // 전략목표, 직무목표
          const mGroupDetailByZ101 = _.groupBy(mDetailData.AppraisalDocDetailSet.results, 'Z101');

          // 평가 프로세스 목록 - 헤더
          let bCompleted = true;
          const mGroupStageByApStatusSub = _.groupBy(aStepList, 'ApStatusSub');
          const aStageHeader = _.chain(mGroupStageByApStatusSub)
            .pick('')
            .values()
            .head()
            .map((o) => {
              const mReturn = { ...o, completed: bCompleted };
              if (sZzapstsSub !== 'X' && o.ApStatus === sZzapsts) bCompleted = false;
              return mReturn;
            })
            .value();

          // 평가 프로세스 목록 - 하위
          bCompleted = true;
          const aGroupStageByApStatusName = _.chain(aStepList)
            .filter((o) => o.ApStatusSub !== '')
            .groupBy('ApStatusName')
            .reduce((acc, cur) => [...acc, [...cur]], [])
            .map((item) =>
              item.map((o) => {
                const mReturn = { ...o, completed: bCompleted };
                if (o.ApStatus === sZzapsts && o.ApStatusSub === sZzapstsSub) bCompleted = false;
                return mReturn;
              })
            )
            .value();

          // Screen control
          const mConvertScreen = _.chain(mDetailData.AppraisalScreenSet.results)
            .reduce((acc, cur) => ({ ...acc, [_.capitalize(cur.ColumnId)]: cur.Zdipopt }), oViewModel.getProperty('/fieldControl/display'))
            .forOwn((value, key, object) => {
              switch (key) {
                case 'Papp': // 부분 평가
                  _.set(object, 'Zapgme', value);
                  break;
                case 'Fapp': // 최종 평가
                  _.set(object, 'Zapgma', value);
                  break;
                case 'Z105': // 목표수행 기간
                  _.chain(object).set('Ztbegda', value).set('Ztendda', value).commit();
                  break;
                case 'Z117': // 달성수준
                  _.chain(object).set('Z1175', value).set('Z1174', value).set('Z1173', value).set('Z1172', value).set('Z1171', value).commit();
                  break;
                case 'Z113': // 핵심결과/실적
                  _.chain(object)
                    .set('Zmarslt', value)
                    .set('Zrslt', _.get(this.FIELD_STATUS_MAP, [sZzapsts, sZzapstsSub, 'Zrslt', sType], value))
                    .commit();
                  break;
                case 'Z125': // 목표항목별 의견
                  _.chain(object)
                    .set('Z125Ee', _.get(this.FIELD_STATUS_MAP, [sZzapsts, sZzapstsSub, 'Z125Ee', sType], value))
                    .set('Z125Er', _.get(this.FIELD_STATUS_MAP, [sZzapsts, sZzapstsSub, 'Z125Er', sType], value))
                    .commit();
                  break;
                case 'Z131': // 목표수립 평가대상자
                case 'Z132': // 목표수립 1차평가자
                case 'Zmepoint': // 자기 평가점수
                case 'Zmapoint': // 1차 평가점수
                case 'Zmbgrade': // 최종 평가등급
                  _.chain(object)
                    .set(key, _.get(this.FIELD_STATUS_MAP, [sZzapsts, sZzapstsSub, key, sType], value))
                    .commit();
                  break;
                default:
                  break;
              }
            })
            .value();

          // Hidden value [V] - 값만 지움
          _.forOwn(mConvertScreen, (value, key) => {
            if (value === this.DISPLAY_TYPE.HIDDEN_VALUE) {
              _.set(mDetailData, key, _.noop());
            }
          });

          // 콤보박스 Entry
          oViewModel.setProperty('/entry/topGoals', new ComboEntry({ codeKey: 'Objid', valueKey: 'Stext', aEntries: aTopGoals }) ?? []);
          oViewModel.setProperty('/entry/levels', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aGrades }) ?? []);
          oViewModel.setProperty('/entry/status', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aStatus }) ?? []);

          // 합계점수
          oViewModel.setProperty('/summary', {
            ..._.chain({ ...mDetailData })
              .pick(this.SUMMARY_PROPERTIES)
              .set('Zmbgrade', _.isEmpty(mDetailData.Zmbgrade) ? 'ALL' : mDetailData.Zmbgrade)
              .value(),
          });

          // 상시관리
          oViewModel.setProperty('/manage', { ..._.pick(mDetailData, this.MANAGE_PROPERTIES) });

          // 평가 단계
          oViewModel.setProperty('/stage/headers', aStageHeader);
          oViewModel.setProperty(
            '/stage/rows',
            _.chain(mGroupStageByApStatusSub[''])
              .map((o, i) => ({ child: aGroupStageByApStatusName[i] }))
              .value()
          );

          // 목표(전략/직무)
          oViewModel.setProperty('/currentItemsLength', _.toLength(mDetailData.AppraisalDocDetailSet.results));
          _.forEach(this.GOAL_TYPE, (v) => oViewModel.setProperty(`/goals/${v.name}`, _.map(mGroupDetailByZ101[v.code], this.initializeGoalItem.bind(this)) ?? []));
          oViewModel.setProperty(
            '/goals/valid',
            _.chain(this.VALIDATION_PROPERTIES)
              .map((o) => ({ ...o, label: this.getBundleText(o.label) }))
              .filter((o) => mConvertScreen[o.field] === 'X')
              .value()
          );

          // 기능버튼
          _.forEach(mDetailData.AppraisalBottnsSet.results, (obj) => oViewModel.setProperty(`/buttons/submit/${obj.ButtonId}`, _.omit(obj, '__metadata')));
          _.chain(this.BUTTON_STATUS_MAP)
            .get([sZzapsts, sZzapstsSub])
            .forOwn((v, k) => oViewModel.setProperty(`/buttons/submit/${k}/Availability`, _.get(v, sType)))
            .commit();
          oViewModel.setProperty('/buttons/Rjctr', mDetailData.Rjctr);

          // 필드속성
          oViewModel.setProperty('/fieldControl/display', mConvertScreen);
          oViewModel.setProperty('/fieldControl/limit', _.assignIn(this.getEntityLimit(ServiceNames.APPRAISAL, 'AppraisalDoc'), this.getEntityLimit(ServiceNames.APPRAISAL, 'AppraisalDocDetail')));
        } catch (oError) {
          this.debug('Controller > Performance Detail > onObjectMatched Error', oError);

          AppUtils.handleError(oError, {
            // onClose: () => this.getRouter().navTo('performance'),
          });
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      getCurrentLocationText(oArguments) {
        return oArguments.year;
      },

      renderStageClass() {
        const oStageHeader = this.byId('stageHeader');
        oStageHeader.addEventDelegate({
          onAfterRendering: _.throttle(() => {
            const aHeaders = this.getViewModel().getProperty('/stage/headers');

            oStageHeader.getItems().forEach((o, i) => o.toggleStyleClass('on', aHeaders[i].completed ?? false));
          }),
        });

        const oStageBody = this.byId('stageBody');
        oStageBody.addEventDelegate({
          onAfterRendering: _.throttle(() => {
            const aRows = this.getViewModel().getProperty('/stage/rows');

            oStageBody.getItems().forEach((row, rowidx) => {
              row.getItems().forEach((o, childidx) => o.toggleStyleClass('on', _.get(aRows, [rowidx, 'child', childidx, 'completed']) ?? false));
            });
          }),
        });
      },

      addGoalItem({ code, name }) {
        const oViewModel = this.getViewModel();
        const aItems = oViewModel.getProperty(`/goals/${name}`);
        const iItemsLength = aItems.length;
        let iCurrentItemsLength = oViewModel.getProperty('/currentItemsLength') ?? 0;

        if (iCurrentItemsLength === 7) {
          MessageBox.alert(this.getBundleText('MSG_10002')); // 더 이상 추가 할 수 없습니다.
          return;
        }

        oViewModel.setProperty('/currentItemsLength', ++iCurrentItemsLength);
        oViewModel.setProperty(`/goals/${name}`, [
          ...aItems,
          {
            rootPath: name,
            expanded: true,
            isSaved: false,
            OrderNo: String(iItemsLength),
            ItemNo: String(iItemsLength + 1),
            Z101: code,
            ..._.reduce(this.GOAL_PROPERTIES, (acc, cur) => ({ ...acc, [cur]: _.includes(this.COMBO_PROPERTIES, cur) ? 'ALL' : _.noop() }), {}),
          },
        ]);
      },

      openRejectDialog() {
        const oView = this.getView();

        if (!this.pRejectDialog) {
          this.pRejectDialog = Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.performance.fragment.RejectDialog',
            controller: this,
          }).then(function (oDialog) {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }
        this.pRejectDialog.then(function (oDialog) {
          oDialog.open();
        });
      },

      getButtonText(sPrcty) {
        const oViewModel = this.getViewModel();
        const mSubmitButtons = oViewModel.getProperty('/buttons/submit');

        return sPrcty === 'C' ? _.get(mSubmitButtons, ['Z_SUBMIT', 'ButtonText']) : _.get(mSubmitButtons, ['SAVE', 'ButtonText']);
      },

      createProcess(sPrcty) {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();
        const mParameter = _.cloneDeep(oViewModel.getProperty('/param'));
        const mManage = _.cloneDeep(oViewModel.getProperty('/manage'));
        const mSummary = _.cloneDeep(oViewModel.getProperty('/summary'));
        const aStrategy = _.cloneDeep(oViewModel.getProperty('/goals/strategy'));
        const aDuty = _.cloneDeep(oViewModel.getProperty('/goals/duty'));

        try {
          if (sPrcty === 'C') {
            _.chain(mParameter).set('OldStatus', mParameter.Zzapsts).set('OldStatusSub', mParameter.ZzapstsSub).set('OldStatusPart', mParameter.ZzapstsPSub).commit();
          }

          Client.deep(oModel, 'AppraisalDoc', {
            ...mParameter,
            ...mManage,
            ...mSummary,
            Menid: this.getCurrentMenuId(),
            Prcty: sPrcty,
            AppraisalDocDetailSet: [...aStrategy, ...aDuty],
          });

          // {저장|전송}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', this.getButtonText(sPrcty)), {
            onClose: () => {
              if (sPrcty === 'C') this.getRouter().navTo('performance');
            },
          });
        } catch (oError) {
          this.debug('Controller > Performance Detail > createProcess Error', oError);

          AppUtils.handleError(oError);
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onPressAddStrategy() {
        const oViewModel = this.getViewModel();

        if (_.isEmpty(oViewModel.getProperty('/entry/topGoals'))) {
          MessageBox.alert(this.getBundleText('MSG_10003')); // 연관 상위 목표가 존재하지 않는 경우 전략목표를 생성할 수 없습니다.
          return;
        }

        this.addGoalItem(this.GOAL_TYPE.STRATEGY);
      },

      onPressAddDuty() {
        this.addGoalItem(this.GOAL_TYPE.DUTY);
      },

      onPressDeleteGoal(oEvent) {
        const oViewModel = this.getViewModel();
        const oSource = oEvent.getSource();

        // 삭제하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00049'), {
          onClose: (sAction) => {
            if (MessageBox.Action.OK === sAction) {
              const { root: sRootPath, itemKey: sDeleteTargetNum } = oSource.data();
              const aItems = oViewModel.getProperty(`/goals/${sRootPath}`);
              const bIsSaved = _.chain(aItems).find({ OrderNo: sDeleteTargetNum }).get('isSaved').value();
              let iCurrentItemsLength = oViewModel.getProperty('/currentItemsLength') ?? 0;

              oViewModel.setProperty('/currentItemsLength', --iCurrentItemsLength);
              oViewModel.setProperty(
                `/goals/${sRootPath}`,
                _.chain(aItems)
                  .tap((array) => _.remove(array, { OrderNo: sDeleteTargetNum }))
                  .map((o, i) => ({ ...o, OrderNo: String(i), ItemNo: String(i + 1) }))
                  .value()
              );

              if (bIsSaved) MessageBox.success(this.getBundleText('MSG_10004')); // 저장 버튼을 클릭하여 삭제를 완료하시기 바랍니다.
            }
          },
        });
      },

      onPressRejectViewButton() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/buttons/isRejectProcess', false);
        this.openRejectDialog();
      },

      onPressRejectDialogClose() {
        this.byId('rejectDialog').close();
      },

      onPressRejectButton() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/buttons/isRejectProcess', true);
        this.openRejectDialog();
      },

      onPressRejectDialogSave() {
        this.onPressRejectDialogClose();
      },

      onPressSaveButton() {
        this.createProcess('T');
      },

      onPressSubmitButton() {
        const oViewModel = this.getViewModel();
        const aStrategyGoals = oViewModel.getProperty('/goals/strategy');
        const aDutyGoals = oViewModel.getProperty('/goals/duty');
        const aFieldProperties = oViewModel.getProperty('/goals/valid');
        const sPrcty = 'C';

        // validation
        if (_.some(aStrategyGoals, (mFieldValue) => !Validator.check({ mFieldValue, aFieldProperties }))) return;
        if (_.some(aDutyGoals, (mFieldValue) => !Validator.check({ mFieldValue, aFieldProperties: _.filter(aFieldProperties, (obj) => obj.field !== 'Z103s') }))) return;

        if (_.sumBy([...aStrategyGoals, ...aDutyGoals], (o) => _.toNumber(o.Fwgt)) !== 100) {
          MessageBox.alert(this.getBundleText('MSG_10005')); // 가중치의 총합은 100이어야 합니다.
          return;
        }

        MessageBox.confirm(this.getBundleText('MSG_00006', this.getButtonText(sPrcty)), {
          // {전송}하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.OK === sAction) this.createProcess(sPrcty);
          },
        });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
