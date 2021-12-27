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
    'sap/ui/yesco/mvc/controller/performance/constant/Constants',
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
    BaseController,
    Constants
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.Detail', {
      getPreviousRouteName() {
        return _.chain(this.getRouter().getHashChanger().getHash()).split('/').dropRight(2).join('/').value();
      },

      getCurrentLocationText(oArguments) {
        return oArguments.year;
      },

      initializeFieldsControl(acc, cur) {
        return { ...acc, [cur]: Constants.DISPLAY_TYPE.EDIT };
      },

      initializeGoalItem(obj, index) {
        return {
          rootPath: _.chain(Constants.GOAL_TYPE).findKey({ code: obj.Z101 }).toLower().value(),
          expanded: _.stubFalse(),
          isSaved: !_.stubFalse(),
          OrderNo: String(index),
          ItemNo: String(index + 1),
          ..._.chain(obj).omit('AppraisalDoc').omit('__metadata').value(),
          ..._.chain(Constants.COMBO_PROPERTIES)
            .reduce((acc, cur) => ({ ...acc, [cur]: _.isEmpty(obj[cur]) ? 'ALL' : obj[cur] }), _.stubObject())
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
            submit: {},
            goal: { ADD: { Availability: false }, DELETE: { Availability: false } },
            Rjctr: '',
            Rjctrin: '',
            isRejectProcess: false,
          },
          currentItemsLength: 0,
          fieldControl: {
            display: _.reduce([...Constants.GOAL_PROPERTIES, ...Constants.SUMMARY_PROPERTIES, ...Constants.MANAGE_PROPERTIES, ...Constants.REJECT_PROPERTIES], this.initializeFieldsControl.bind(this), {}),
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
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          const oView = this.getView();
          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const oListView = oView.getParent().getPage(Constants.LIST_PAGE_ID);
          const { type: sType, year: sYear } = oParameter;

          if (_.isEmpty(oListView) || _.isEmpty(oListView.getModel().getProperty('/parameter/rowData'))) {
            throw new UI5Error({ code: 'E', message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
          }

          const mParameter = _.omit(_.cloneDeep(oListView.getModel().getProperty('/parameter/rowData')), '__metadata');
          const { Zzapsts: sZzapsts, ZzapstsSub: sZzapstsSub, Zonlydsp: sZonlydsp } = _.pick(mParameter, ['Zzapsts', 'ZzapstsSub', 'Zonlydsp']);

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
              const mReturn = { ..._.omit(o, '__metadata'), completed: bCompleted };
              if (sZzapstsSub !== 'X' && o.ApStatus === sZzapsts) bCompleted = false;
              return mReturn;
            })
            .value();

          // 평가 프로세스 목록 - 하위
          bCompleted = true;
          const aGroupStageByApStatusName = _.chain(aStepList)
            .filter((o) => o.ApStatusSub !== '')
            .groupBy('ApStatusName')
            .reduce((acc, cur) => [...acc, [...cur]], _.stubArray())
            .map((item) =>
              item.map((o) => {
                const mReturn = { ..._.omit(o, '__metadata'), completed: bCompleted };
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
                  _.chain(object).set('Zapgme', value).set('Papp1', value).commit();
                  break;
                case 'Fapp': // 최종 평가
                  _.chain(object).set('Zapgma', value).set('Papp2', value).commit();
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
                    .set('Zrslt', _.get(Constants.FIELD_STATUS_MAP, [sZzapsts, sZzapstsSub, 'Zrslt', sType], value))
                    .commit();
                  break;
                case 'Z125': // 목표항목별 의견
                  _.chain(object)
                    .set('Z125Ee', _.get(Constants.FIELD_STATUS_MAP, [sZzapsts, sZzapstsSub, 'Z125Ee', sType], value))
                    .set('Z125Er', _.get(Constants.FIELD_STATUS_MAP, [sZzapsts, sZzapstsSub, 'Z125Er', sType], value))
                    .commit();
                  break;
                case 'Z131': // 목표수립 평가대상자
                case 'Z132': // 목표수립 1차평가자
                case 'Zmepoint': // 자기 평가점수
                case 'Zmapoint': // 1차 평가점수
                case 'Zmbgrade': // 최종 평가등급
                  _.set(object, key, _.get(Constants.FIELD_STATUS_MAP, [sZzapsts, sZzapstsSub, key, sType], value));
                  break;
                default:
                  break;
              }
            })
            .value();

          oViewModel.setProperty('/entry/topGoals', new ComboEntry({ codeKey: 'Objid', valueKey: 'Stext', aEntries: aTopGoals }) ?? []);
          oViewModel.setProperty('/entry/levels', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aGrades }) ?? []);
          oViewModel.setProperty('/entry/status', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aStatus }) ?? []);

          // 합계점수
          oViewModel.setProperty('/summary', {
            ..._.chain({ ...mDetailData })
              .pick(Constants.SUMMARY_PROPERTIES)
              .set('Zmbgrade', _.isEmpty(mDetailData.Zmbgrade) ? 'ALL' : mDetailData.Zmbgrade)
              .value(),
          });

          // 상시관리
          oViewModel.setProperty('/manage', { ..._.pick(mDetailData, Constants.MANAGE_PROPERTIES) });

          // 평가 단계
          oViewModel.setProperty('/stage/headers', aStageHeader);
          oViewModel.setProperty(
            '/stage/rows',
            _.chain(mGroupStageByApStatusSub[''])
              .map((o, i) => ({ child: aGroupStageByApStatusName[i] }))
              .value()
          );

          // 목표(전략/직무)
          _.forEach(Constants.GOAL_TYPE, (v) => oViewModel.setProperty(`/goals/${v.name}`, _.map(mGroupDetailByZ101[v.code], this.initializeGoalItem.bind(this)) ?? []));
          oViewModel.setProperty('/currentItemsLength', _.toLength(mDetailData.AppraisalDocDetailSet.results));
          oViewModel.setProperty(
            '/goals/valid',
            _.chain(Constants.VALIDATION_PROPERTIES)
              .map((o) => ({ ...o, label: this.getBundleText(o.label) }))
              .filter((o) => mConvertScreen[o.field] === 'X')
              .value()
          );

          // 기능버튼
          const mButtons = oViewModel.getProperty('/buttons');
          _.chain(mButtons)
            .tap((o) => _.set(o, 'Rjctr', _.get(mDetailData, 'Rjctr', _.noop())))
            .tap((o) =>
              _.chain(o.goal)
                .set(['ADD', 'Availability'], _.isEqual(_.get(mConvertScreen, ['Obj0']), Constants.DISPLAY_TYPE.EDIT))
                .set(['DELETE', 'Availability'], _.isEqual(_.get(mConvertScreen, ['Obj0']), Constants.DISPLAY_TYPE.EDIT))
                .commit()
            )
            .tap((o) => _.forEach(mDetailData.AppraisalBottnsSet.results, (obj) => _.set(o.submit, obj.ButtonId, _.chain(obj).set('process', true).omit('__metadata').value())))
            .tap((o) => {
              _.chain(Constants.BUTTON_STATUS_MAP)
                .get([sZzapsts, sZzapstsSub])
                .forOwn((v, k) =>
                  _.chain(o.submit)
                    .set([k, 'Availability'], _.get(v, sType))
                    .set([k, 'ButtonText'], this.getBundleText(_.get(v, 'label')))
                    .set([k, 'process'], _.get(v, 'process', false))
                    .commit()
                )
                .commit();
            })
            .commit();

          // 조회모드
          if (_.isEqual(sZonlydsp, 'X')) {
            _.forEach(mButtons.goal, (v) => _.set(v, 'Availability', false));
            _.chain(mButtons.submit)
              .filter({ process: true })
              .forEach((v) => _.set(v, 'Availability', ''))
              .commit();

            _.forEach(mConvertScreen, (v, p) => {
              if (_.isEqual(v, Constants.DISPLAY_TYPE.EDIT)) _.set(mConvertScreen, p, Constants.DISPLAY_TYPE.DISPLAY_ONLY);
            });
          }

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

      renderStageClass() {
        const oStageHeader = this.byId('stageHeader');
        oStageHeader.addEventDelegate({
          onAfterRendering: _.throttle(() => {
            const aHeaders = this.getViewModel().getProperty('/stage/headers');
            _.forEach(oStageHeader.getItems(), (o, i) => o.toggleStyleClass('on', _.get(aHeaders, [i, 'completed'], false)));
          }),
        });

        const oStageBody = this.byId('stageBody');
        oStageBody.addEventDelegate({
          onAfterRendering: _.throttle(() => {
            const aRows = this.getViewModel().getProperty('/stage/rows');
            _.forEach(oStageBody.getItems(), (row, rowidx) => {
              _.forEach(row.getItems(), (o, childidx) => o.toggleStyleClass('on', _.get(aRows, [rowidx, 'child', childidx, 'completed'], false)));
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
            ..._.reduce(Constants.GOAL_PROPERTIES, (acc, cur) => ({ ...acc, [cur]: _.includes(Constants.COMBO_PROPERTIES, cur) ? 'ALL' : _.noop() }), {}),
            Z101: code,
            rootPath: name,
            expanded: true,
            isSaved: false,
            OrderNo: String(iItemsLength),
            ItemNo: String(iItemsLength + 1),
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

      async createProcess(sPrcty) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const mParameter = _.cloneDeep(oViewModel.getProperty('/param'));
          const mManage = _.cloneDeep(oViewModel.getProperty('/manage'));
          const mSummary = _.cloneDeep(oViewModel.getProperty('/summary'));
          const aStrategy = _.cloneDeep(oViewModel.getProperty('/goals/strategy'));
          const aDuty = _.cloneDeep(oViewModel.getProperty('/goals/duty'));

          if (sPrcty === 'C') {
            _.chain(mParameter).set('OldStatus', mParameter.Zzapsts).set('OldStatusSub', mParameter.ZzapstsSub).set('OldStatusPart', mParameter.ZzapstsPSub).commit();
          }

          await Client.deep(oModel, 'AppraisalDoc', {
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
        } finally {
          oViewModel.setProperty('/busy', false);
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

        this.addGoalItem(Constants.GOAL_TYPE.STRATEGY);
      },

      onPressAddDuty() {
        this.addGoalItem(Constants.GOAL_TYPE.DUTY);
      },

      onPressDeleteGoal(oEvent) {
        const oViewModel = this.getViewModel();
        const oSource = oEvent.getSource();

        // 삭제하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00049'), {
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

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
            if (MessageBox.Action.CANCEL === sAction) return;

            this.createProcess(sPrcty);
          },
        });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
