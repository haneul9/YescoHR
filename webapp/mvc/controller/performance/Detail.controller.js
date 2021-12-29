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
    'sap/ui/yesco/mvc/model/type/Percent',
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
        return oArguments.sYear ?? moment().format('YYYY');
      },

      initializeFieldsControl(acc, cur) {
        return { ...acc, [cur]: Constants.DISPLAY_TYPE.EDIT };
      },

      initializeGoalItem(obj, index) {
        return {
          rootPath: _.chain(Constants.GOAL_TYPE).findKey({ code: obj.Z101 }).toLower().value(),
          expanded: _.stubFalse(),
          isSaved: _.stubTrue(),
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
            form: {
              Rjctr: '',
              Rjctrin: '',
              isRejectProcess: false,
            },
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
        const { sType, sYear } = oParameter;
        const mListRoute = _.get(Constants.LIST_PAGE, sType);

        oViewModel.setProperty('/busy', true);

        try {
          const oView = this.getView();
          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const oListView = oView.getParent().getPage(mListRoute.id);

          if (_.isEmpty(oListView) || _.isEmpty(oListView.getModel().getProperty('/parameter/rowData'))) {
            throw new UI5Error({ code: 'E', message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
          }

          const mParameter = _.chain(oListView.getModel().getProperty('/parameter/rowData')).cloneDeep().omit('__metadata').value();
          const { Zzapsts: sZzapsts, ZzapstsSub: sZzapstsSub, Zonlydsp: sZonlydsp } = mParameter;

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
              Prcty: Constants.PROCESS_TYPE.DETAIL.code,
              Zzappgb: sType,
              AppraisalDocDetailSet: [],
              AppraisalBottnsSet: [],
              AppraisalScreenSet: [],
            }),
          ]);

          // Combo Entry
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
          oViewModel.setProperty('/manage', { ..._.pick({ ...mDetailData }, Constants.MANAGE_PROPERTIES) });

          // 평가 프로세스 목록 - 헤더
          let bCompleted = true;
          const mGroupStageByApStatusSub = _.groupBy(aStepList, 'ApStatusSub');
          const aStageHeader = _.map(mGroupStageByApStatusSub[''], (o) => {
            const mReturn = { ..._.omit(o, '__metadata'), completed: bCompleted };
            if (!_.isEqual(sZzapstsSub, 'X') && _.isEqual(o.ApStatus, sZzapsts)) bCompleted = false;
            return mReturn;
          });

          // 평가 프로세스 목록 - 하위
          bCompleted = true;
          const aGroupStageByApStatusName = _.chain(aStepList)
            .filter((o) => !_.isEqual(o.ApStatusSub, ''))
            .groupBy('ApStatusName')
            .reduce((acc, cur) => [...acc, [...cur]], _.stubArray())
            .map((item) =>
              _.map(item, (o) => {
                const mReturn = { ..._.omit(o, '__metadata'), completed: bCompleted };
                if (_.isEqual(o.ApStatus, sZzapsts) && _.isEqual(o.ApStatusSub, sZzapstsSub)) bCompleted = false;
                return mReturn;
              })
            )
            .value();

          // 평가 단계
          oViewModel.setProperty('/stage/headers', aStageHeader);
          oViewModel.setProperty(
            '/stage/rows',
            _.map(mGroupStageByApStatusSub[''], (o, i) => ({ child: aGroupStageByApStatusName[i] }))
          );

          const mButtons = oViewModel.getProperty('/buttons');
          const mConvertScreen = _.chain(mDetailData.AppraisalScreenSet.results)
            .reduce((acc, cur) => ({ ...acc, [_.capitalize(cur.ColumnId)]: cur.Zdipopt }), oViewModel.getProperty('/fieldControl/display'))
            .forOwn((value, key, object) => {
              if (_.has(Constants.FIELD_MAPPING, key)) {
                _.forEach(_.get(Constants.FIELD_MAPPING, key), (subKey) => _.set(object, subKey, _.get(Constants.FIELD_STATUS_MAP, [sZzapsts, sZzapstsSub, subKey, sType], value)));
              }
            })
            .value();

          // 기능버튼
          _.chain(mButtons)
            .tap((o) => _.set(o, ['form', 'Rjctr'], _.get(mDetailData, 'Rjctr', _.noop())))
            .tap((o) =>
              _.chain(o.goal)
                .set(['ADD', 'Availability'], _.isEqual(_.get(mConvertScreen, 'Obj0'), Constants.DISPLAY_TYPE.EDIT))
                .set(['DELETE', 'Availability'], _.isEqual(_.get(mConvertScreen, 'Obj0'), Constants.DISPLAY_TYPE.EDIT))
                .commit()
            )
            .tap((o) => _.forEach(mDetailData.AppraisalBottnsSet.results, (obj) => _.set(o.submit, obj.ButtonId, _.chain(obj).set('process', _.stubTrue()).omit('__metadata').value())))
            .tap((o) => {
              _.chain(Constants.BUTTON_STATUS_MAP)
                .get([sZzapsts, sZzapstsSub])
                .forOwn((v, k) =>
                  _.chain(o.submit)
                    .set([k, 'Availability'], _.get(v, sType))
                    .set([k, 'ButtonText'], this.getBundleText(_.get(v, 'label')))
                    .set([k, 'process'], _.get(v, 'process', _.stubFalse()))
                    .commit()
                )
                .commit();
            })
            .commit();

          // 조회모드
          if (_.isEqual(sZonlydsp, 'X')) {
            _.forEach(mButtons.goal, (v) => _.set(v, 'Availability', _.stubFalse()));
            _.chain(mButtons.submit)
              .filter({ process: true })
              .forEach((v) => _.set(v, 'Availability', ''))
              .commit();

            _.forEach(mConvertScreen, (v, p) => {
              if (_.isEqual(v, Constants.DISPLAY_TYPE.EDIT)) _.set(mConvertScreen, p, Constants.DISPLAY_TYPE.DISPLAY_ONLY);
            });
          }

          // 목표(전략/직무)
          const mGroupDetailByZ101 = _.groupBy(mDetailData.AppraisalDocDetailSet.results, 'Z101');

          _.forEach(Constants.GOAL_TYPE, (v) => oViewModel.setProperty(`/goals/${v.name}`, _.map(mGroupDetailByZ101[v.code], this.initializeGoalItem.bind(this)) ?? []));
          oViewModel.setProperty('/currentItemsLength', _.size(mDetailData.AppraisalDocDetailSet.results));
          oViewModel.setProperty(
            '/goals/valid',
            _.chain(Constants.VALIDATION_PROPERTIES)
              .filter((o) => _.isEqual(_.get(mConvertScreen, o.field), Constants.DISPLAY_TYPE.EDIT))
              .map((o) => ({ ...o, label: this.getBundleText(o.label) }))
              .value()
          );

          // 필드속성
          oViewModel.setProperty('/fieldControl/display', mConvertScreen);
          oViewModel.setProperty('/fieldControl/limit', _.assignIn(this.getEntityLimit(ServiceNames.APPRAISAL, 'AppraisalDoc'), this.getEntityLimit(ServiceNames.APPRAISAL, 'AppraisalDocDetail')));
        } catch (oError) {
          this.debug(`Controller > ${mListRoute.route} Detail > onObjectMatched Error`, oError);

          AppUtils.handleError(oError, {
            onClose: () => this.onNavBack(),
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
            _.forEach(oStageHeader.getItems(), (o, i) => o.toggleStyleClass('on', _.get(aHeaders, [i, 'completed'], _.stubFalse())));
          }),
        });

        const oStageBody = this.byId('stageBody');
        oStageBody.addEventDelegate({
          onAfterRendering: _.throttle(() => {
            const aRows = this.getViewModel().getProperty('/stage/rows');
            _.forEach(oStageBody.getItems(), (row, rowidx) => {
              _.forEach(row.getItems(), (o, childidx) => o.toggleStyleClass('on', _.get(aRows, [rowidx, 'child', childidx, 'completed'], _.stubFalse())));
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
            ..._.reduce(Constants.GOAL_PROPERTIES, (acc, cur) => ({ ...acc, [cur]: _.includes(Constants.COMBO_PROPERTIES, cur) ? 'ALL' : _.noop() }), _.stubObject()),
            Z101: code,
            rootPath: name,
            expanded: _.stubTrue(),
            isSaved: _.stubFalse(),
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
            name: Constants.REJECT_DIALOG_ID,
            controller: this,
          }).then((oDialog) => {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }
        this.pRejectDialog.then((oDialog) => oDialog.open());
      },

      async createProcess({ code, label }) {
        const oViewModel = this.getViewModel();
        const sType = oViewModel.getProperty('/type');
        const sListRouteName = _.get(Constants.LIST_PAGE, [sType, 'route']);

        oViewModel.setProperty('/busy', true);

        try {
          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const mParameter = _.cloneDeep(oViewModel.getProperty('/param'));
          const mManage = _.cloneDeep(oViewModel.getProperty('/manage'));
          const mSummary = _.cloneDeep(oViewModel.getProperty('/summary'));
          const aStrategy = _.cloneDeep(oViewModel.getProperty('/goals/strategy'));
          const aDuty = _.cloneDeep(oViewModel.getProperty('/goals/duty'));
          const bIsSave = _.isEqual(code, Constants.PROCESS_TYPE.SAVE.code);

          if (!bIsSave) {
            switch (code) {
              case Constants.PROCESS_TYPE.SAVE.code:
              case Constants.PROCESS_TYPE.REJECT.code:
              case Constants.PROCESS_TYPE.CANCEL.code:
                _.chain(mParameter).set('OldStatus', mParameter.Zzapsts).set('OldStatusSub', mParameter.ZzapstsSub).set('OldStatusPart', mParameter.ZzapstsPSub).commit();
              default:
                break;
            }
          }

          await Client.deep(oModel, 'AppraisalDoc', {
            ...mParameter,
            ...mManage,
            ...mSummary,
            Menid: this.getCurrentMenuId(),
            Prcty: code,
            AppraisalDocDetailSet: [...aStrategy, ...aDuty],
          });

          // {저장|전송|승인|취소}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', label), {
            onClose: () => {
              if (!bIsSave) this.getRouter().navTo(sListRouteName);
            },
          });
        } catch (oError) {
          this.debug(`Controller > ${sListRouteName} Detail > createProcess Error`, oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onChangeZtbegda(oEvent) {
        const oControl = oEvent.getSource();
        const oBinding = oControl.getBindingContext();
        const dStartDate = moment(oControl.getDateValue());
        const dEndDate = oBinding.getProperty('Ztendda');

        if (_.isDate(dEndDate) && moment(dEndDate).isBefore(dStartDate)) {
          oBinding.getModel().setProperty(`${oBinding.getPath()}/Ztendda`, _.noop());
        }
      },

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

            const { sRootPath, sDeleteTargetNum } = oSource.data();
            const aGoalItems = oViewModel.getProperty(`/goals/${sRootPath}`);
            const bIsSavedGoalItem = _.chain(aGoalItems).find({ OrderNo: sDeleteTargetNum }).get('isSaved').value();
            let iCurrentItemsLength = oViewModel.getProperty('/currentItemsLength') ?? 0;

            oViewModel.setProperty('/currentItemsLength', --iCurrentItemsLength);
            oViewModel.setProperty(
              `/goals/${sRootPath}`,
              _.chain(aGoalItems)
                .reject({ OrderNo: sDeleteTargetNum })
                .map((o, i) => ({ ...o, OrderNo: String(i), ItemNo: String(i + 1) }))
                .value()
            );

            if (bIsSavedGoalItem) MessageBox.success(this.getBundleText('MSG_10004')); // 저장 버튼을 클릭하여 삭제를 완료하시기 바랍니다.
          },
        });
      },

      onPressDiagnosisButton() {
        MessageBox.alert('Not ready yet.');
      },

      onPressRejectViewButton() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/buttons/form/isRejectProcess', false);
        this.openRejectDialog();
      },

      onPressRejectDialogClose() {
        this.byId('rejectDialog').close();
      },

      onPressApproveButton() {
        const mProcessType = Constants.PROCESS_TYPE.APPROVE;

        MessageBox.confirm(this.getBundleText('MSG_00006', mProcessType.label), {
          // {승인}하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            this.createProcess(mProcessType);
          },
        });
      },

      onPressCheckedButton() {
        MessageBox.alert('Not ready yet.');
      },

      onPressOppositionButton() {
        MessageBox.alert('Not ready yet.');
      },

      onPressRejectButton() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/buttons/form/isRejectProcess', true);
        this.openRejectDialog();
      },

      onPressRejectDialogSave() {
        const mProcessType = Constants.PROCESS_TYPE.REJECT;

        MessageBox.confirm(this.getBundleText('MSG_00006', mProcessType.label), {
          // {반려}하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            this.createProcess(mProcessType);
            this.onPressRejectDialogClose();
          },
        });
      },

      onPressCancelButton() {
        const mProcessType = Constants.PROCESS_TYPE.CANCEL;

        MessageBox.confirm(this.getBundleText('MSG_00006', mProcessType.label), {
          // {취소}하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            this.createProcess(mProcessType);
          },
        });
      },

      onPressSaveButton() {
        this.createProcess(Constants.PROCESS_TYPE.SAVE);
      },

      onPressSubmitButton() {
        const oViewModel = this.getViewModel();
        const aStrategyGoals = _.cloneDeep(oViewModel.getProperty('/goals/strategy'));
        const aDutyGoals = _.cloneDeep(oViewModel.getProperty('/goals/duty'));
        const mManage = _.cloneDeep(oViewModel.getProperty('/manage'));
        const aValid = _.cloneDeep(oViewModel.getProperty('/goals/valid'));
        const aGoalValid = _.filter(aValid, (o) => _.includes(Constants.GOAL_PROPERTIES, o.field));
        const aManageValid = _.filter(aValid, (o) => _.includes(Constants.MANAGE_PROPERTIES, o.field));
        const mProcessType = Constants.PROCESS_TYPE.SEND;

        // validation
        if (_.some(aStrategyGoals, (mFieldValue) => !Validator.check({ mFieldValue, aFieldProperties: aGoalValid, sPrefixMessage: `[${_.truncate(mFieldValue.Obj0)}]의` }))) return;
        if (_.some(aDutyGoals, (mFieldValue) => !Validator.check({ mFieldValue, aFieldProperties: _.reject(aGoalValid, { field: 'Z103s' }), sPrefixMessage: `[${_.truncate(mFieldValue.Obj0)}]의` }))) return;
        if (!Validator.check({ mFieldValue: mManage, aFieldProperties: aManageValid })) return;

        if (
          !_.chain([...aStrategyGoals, ...aDutyGoals])
            .map((o) => _.toNumber(o.Fwgt))
            .sum()
            .isEqual(100)
            .value()
        ) {
          MessageBox.alert(this.getBundleText('MSG_10005')); // 가중치의 총합은 100이어야 합니다.
          return;
        }

        MessageBox.confirm(this.getBundleText('MSG_00006', mProcessType.label), {
          // {전송}하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            this.createProcess(mProcessType);
          },
        });
      },

      onPressCompleteButton() {},

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
