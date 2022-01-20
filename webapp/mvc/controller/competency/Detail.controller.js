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
    'sap/ui/yesco/mvc/controller/competency/constant/Constants',
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

    return BaseController.extend('sap.ui.yesco.mvc.controller.competency.Detail', {
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
          appointee: {},
          stage: {
            headers: [],
            rows: [],
          },
          level: {
            expanded: false,
            type: 'level5',
            count: 5,
            headers: [
              { type: 'head', text: '역량 수준' }, //
              { type: 'body', label: 'Level 1', text: '(학습 단계)' },
              { type: 'body', label: 'Level 2' },
              { type: 'body', label: 'Level 3', text: '(적응 단계 or 적응/지도)' },
              { type: 'body', label: 'Level 4' },
              { type: 'body', label: 'Level 5', text: '(지도/조정 단계 or 실현단계)' },
            ],
            rows: [
              { type: 'head', child: [{ text: '단계 정의' }] }, //
              { type: 'body', child: [{ text: '직무역할과 관련된 기능적 기술 및 지식을 학습하는 단계' }] },
              { type: 'body', child: [{ text: 'Level 1과 3 사이' }] },
              { type: 'body', child: [{ text: '직무역할과 관련된 기능적 기술 및 지식을 학습하는 단계' }] },
              { type: 'body', child: [{ text: 'Level 3과 5 사이' }] },
              { type: 'body', child: [{ text: '직무역할과 관련된 기능적 기술 및 지식을 학습하는 단계' }] },
              { type: 'head', child: [{ text: '특징' }] },
              { type: 'body', child: [{ text: '직무역할과 관련된 기능적 기술 및 지식을 학습하는 단계' }, { text: '직무역할과 관련된 기능적 기술 및 지식을 학습하는 단계' }, { text: '직무역할과 관련된 기능적 기술 및 지식을 학습하는 단계' }] },
              { type: 'blank', child: [] },
              { type: 'body', child: [{ text: '직무역할과 관련된 기능적 기술 및 지식을 학습하는 단계' }, { text: '직무역할과 관련된 기능적 기술 및 지식을 학습하는 단계' }, { text: '직무역할과 관련된 기능적 기술 및 지식을 학습하는 단계' }] },
              { type: 'blank', child: [] },
              { type: 'body', child: [{ text: '직무역할과 관련된 기능적 기술 및 지식을 학습하는 단계' }, { text: '직무역할과 관련된 기능적 기술 및 지식을 학습하는 단계' }, { text: '직무역할과 관련된 기능적 기술 및 지식을 학습하는 단계' }] },
            ],
          },
          entry: {
            levels: [],
          },
          buttons: {
            submit: {},
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
            header: {},
            strategy: [
              { Obj0: 'Integrity', Zapgme: '4', Zapgma: '5', Zmarslt: 'LS인은 원칙과 기본을 지키고 모든 일을 합리적으로 수행한다.' }, //
              { Obj0: 'Respect', Zapgme: '5', Zapgma: '4', Zmarslt: 'LS인은 원칙과 기본을 지키고 모든 일을 합리적으로 수행한다.' },
              { Obj0: 'Excellence', Zapgme: '3', Zapgma: '3', Zmarslt: 'LS인은 원칙과 기본을 지키고 모든 일을 합리적으로 수행한다.' },
              { Obj0: '성장 마인드', Zapgme: '2', Zapgma: '2', Zmarslt: 'LS인은 원칙과 기본을 지키고 모든 일을 합리적으로 수행한다.' },
            ],
            duty: [
              { Obj0: '창의적 변화주도', Zapgme: '1', Zapgma: '1', Zmarslt: '조직이 새로운 아이디어에 더욱 개방적이고 유연하게 대처 할 수 있도록 활력을 불어넣으며 기존의 방식에서 과감히\n탈피하여 새로운 방법, 절차, 기술을 적용하도록 적극적으로 장려하여 창의적 변화를 주도한다.' }, //
              { Obj0: '통찰력 있는 비전제시', Zapgme: '5', Zapgma: '4', Zmarslt: 'LS인은 원칙과 기본을 지키고 모든 일을 합리적으로 수행한다.' },
            ],
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
          const oListView = oView.getParent().getPage(mListRoute.id);

          if (_.isEmpty(oListView) || _.isEmpty(oListView.getModel().getProperty('/parameter/rowData'))) {
            throw new UI5Error({ code: 'E', message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
          }

          const mParameter = _.chain(oListView.getModel().getProperty('/parameter/rowData')).cloneDeep().omit('__metadata').value();
          const { Zzapsts: sZzapsts, ZzapstsSub: sZzapstsSub, ZzapstsPSub: sZzapstsPSub, Zonlydsp: sZonlydsp } = mParameter;
          // 4-1 평가실시 - 부분평가중일 경우 ZzapstsPSub가 A|B로 들어오면 1차평가중 상태로 변경한다.
          const sLogicalZzapstsSub = _.isEqual(sZzapsts + sZzapstsSub, '41') && !_.isEmpty(sZzapstsPSub) ? sZzapstsPSub : sZzapstsSub;

          this.setAppointee(sType, mParameter.Zzappee);

          _.chain(mParameter).set('OldStatus', mParameter.Zzapsts).set('OldStatusSub', mParameter.ZzapstsSub).set('OldStatusPart', mParameter.ZzapstsPSub).commit();
          oViewModel.setProperty('/param', { ...mParameter });
          oViewModel.setProperty('/type', sType);
          oViewModel.setProperty('/year', sYear);

          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const fCurriedGetEntitySet = Client.getEntitySet(oModel);
          const [
            aStepList, //
            aGrades,
            // mDetailData,
          ] = await Promise.all([
            fCurriedGetEntitySet('AppStatusStepList', { Werks: this.getSessionProperty('Werks'), Zzappid: mParameter.Zzappid, Zzappty: '20' }),
            fCurriedGetEntitySet('AppGradeList'),
            // Client.deep(oModel, 'AppraisalDoc', {
            //   ...mParameter,
            //   Menid: this.getCurrentMenuId(),
            //   Prcty: Constants.PROCESS_TYPE.DETAIL.code,
            //   Zzappgb: sType,
            //   AppraisalDocDetailSet: [],
            //   AppraisalBottnsSet: [],
            //   AppraisalScreenSet: [],
            // }),
          ]);

          // Combo Entry
          oViewModel.setProperty('/entry/levels', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aGrades }) ?? []);

          // 평가 프로세스 목록 - 헤더
          let bCompleted = true;
          const mGroupStageByApStatusSub = _.groupBy(aStepList, 'ApStatusSub');
          const aStageHeader = _.map(mGroupStageByApStatusSub[''], (o) => {
            const mReturn = { ..._.omit(o, '__metadata'), completed: bCompleted };
            if (!_.isEqual(sLogicalZzapstsSub, 'X') && _.isEqual(o.ApStatus, sZzapsts)) bCompleted = false;
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
                if (_.isEqual(o.ApStatus, sZzapsts) && _.isEqual(o.ApStatusSub, sLogicalZzapstsSub)) bCompleted = false;
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

          // const mButtons = oViewModel.getProperty('/buttons');
          // const mConvertScreen = _.chain(mDetailData.AppraisalScreenSet.results)
          //   .reduce((acc, cur) => ({ ...acc, [_.capitalize(cur.ColumnId)]: cur.Zdipopt }), oViewModel.getProperty('/fieldControl/display'))
          //   .forOwn((value, key, object) => {
          //     if (_.has(Constants.FIELD_MAPPING, key)) {
          //       _.forEach(_.get(Constants.FIELD_MAPPING, key), (subKey) => _.set(object, subKey, _.get(Constants.FIELD_STATUS_MAP, [sZzapsts, sLogicalZzapstsSub, subKey, sType], value)));
          //     }
          //   })
          //   .value();

          // // 기능버튼
          // _.chain(mButtons)
          //   .tap((o) => _.set(o, ['form', 'Rjctr'], _.get(mDetailData, 'Rjctr', _.noop())))
          //   .tap((o) => _.forEach(mDetailData.AppraisalBottnsSet.results, (obj) => _.set(o.submit, obj.ButtonId, _.chain(obj).set('process', _.stubTrue()).omit('__metadata').value())))
          //   .tap((o) => {
          //     _.chain(Constants.BUTTON_STATUS_MAP)
          //       .get([sZzapsts, sLogicalZzapstsSub])
          //       .forOwn((v, k) =>
          //         _.chain(o.submit)
          //           .set([k, 'Availability'], _.get(v, sType))
          //           .set([k, 'ButtonText'], this.getBundleText(_.get(v, 'label')))
          //           .set([k, 'process'], _.get(v, 'process', _.stubFalse()))
          //           .commit()
          //       )
          //       .commit();
          //   })
          //   .commit();

          // // 조회모드
          // if (_.isEqual(sZonlydsp, 'X')) {
          //   _.forEach(mButtons.goal, (v) => _.set(v, 'Availability', _.stubFalse()));
          //   _.chain(mButtons.submit)
          //     .filter({ process: true })
          //     .forEach((v) => _.set(v, 'Availability', ''))
          //     .commit();

          //   _.forEach(mConvertScreen, (v, p) => {
          //     if (_.isEqual(v, Constants.DISPLAY_TYPE.EDIT)) _.set(mConvertScreen, p, Constants.DISPLAY_TYPE.DISPLAY_ONLY);
          //   });

          //   if (_.isEqual(sType, Constants.APPRAISER_TYPE.MA) && (_.isEqual(['2', 'D'], [sZzapsts, sLogicalZzapstsSub]) || _.isEqual(['3', 'H'], [sZzapsts, sLogicalZzapstsSub]))) {
          //     _.set(mConvertScreen, 'Z140', Constants.DISPLAY_TYPE.EDIT);
          //   }
          // }

          // 목표(전략/직무)
          // const mGroupDetailByZ101 = _.groupBy(mDetailData.AppraisalDocDetailSet.results, 'Z101');

          // _.forEach(Constants.GOAL_TYPE, (v) => oViewModel.setProperty(`/goals/${v.name}`, _.map(mGroupDetailByZ101[v.code], this.initializeGoalItem.bind(this)) ?? []));
          // oViewModel.setProperty('/currentItemsLength', _.size(mDetailData.AppraisalDocDetailSet.results));
          // oViewModel.setProperty(
          //   '/goals/valid',
          //   _.chain(Constants.VALIDATION_PROPERTIES)
          //     .filter((o) => _.isEqual(_.get(mConvertScreen, o.field), Constants.DISPLAY_TYPE.EDIT))
          //     .map((o) => ({ ...o, label: this.getBundleText(o.label) }))
          //     .value()
          // );

          // // 필드속성
          // oViewModel.setProperty('/fieldControl/display', mConvertScreen);
          // oViewModel.setProperty('/fieldControl/limit', _.assignIn(this.getEntityLimit(ServiceNames.APPRAISAL, 'AppraisalDoc'), this.getEntityLimit(ServiceNames.APPRAISAL, 'AppraisalDocDetail')));
        } catch (oError) {
          this.debug(`Controller > ${mListRoute.route} Detail > onObjectMatched Error`, oError);

          AppUtils.handleError(oError, {
            onClose: () => this.onNavBack(),
          });
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async setAppointee(sType, sPernr) {
        const oViewModel = this.getViewModel();

        if (_.isEqual(sType, Constants.APPRAISER_TYPE.ME)) {
          oViewModel.setProperty('/appointee', AppUtils.getAppComponent().getAppointeeModel().getData());
        } else {
          const [mAppointee] = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
            Ename: sPernr,
          });

          oViewModel.setProperty('/appointee', { ...mAppointee, Orgtx: mAppointee.Fulln, Photo: mAppointee.Photo || 'asset/image/avatar-unknown.svg' });
        }
      },

      changeTab(sTabKey) {
        this.getViewModel().setProperty('/tab/selectedKey', sTabKey);
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

        if (iCurrentItemsLength === 10) {
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

      validation() {
        const oViewModel = this.getViewModel();
        const aStrategyGoals = _.cloneDeep(oViewModel.getProperty('/goals/strategy'));
        const aDutyGoals = _.cloneDeep(oViewModel.getProperty('/goals/duty'));
        const mManage = _.cloneDeep(oViewModel.getProperty('/manage'));
        const aValid = _.cloneDeep(oViewModel.getProperty('/goals/valid'));
        const aGoalValid = _.filter(aValid, (o) => _.includes(Constants.GOAL_PROPERTIES, o.field));
        const aManageValid = _.filter(aValid, (o) => _.includes(Constants.MANAGE_PROPERTIES, o.field));

        if (_.some(aStrategyGoals, (mFieldValue) => !Validator.check({ mFieldValue, aFieldProperties: aGoalValid, sPrefixMessage: `[${_.truncate(mFieldValue.Obj0)}]의` })) || _.some(aDutyGoals, (mFieldValue) => !Validator.check({ mFieldValue, aFieldProperties: _.reject(aGoalValid, { field: 'Z103s' }), sPrefixMessage: `[${_.truncate(mFieldValue.Obj0)}]의` }))) {
          this.changeTab(Constants.TAB.GOAL);
          return false;
        }
        if (!Validator.check({ mFieldValue: mManage, aFieldProperties: aManageValid })) {
          this.changeTab(Constants.TAB.OPINION);
          return false;
        }

        if (
          !_.chain([...aStrategyGoals, ...aDutyGoals])
            .map((o) => _.toNumber(o.Fwgt))
            .sum()
            .isEqual(100)
            .value()
        ) {
          MessageBox.alert(this.getBundleText('MSG_10005')); // 가중치의 총합은 100%이어야 합니다.
          this.changeTab(Constants.TAB.GOAL);
          return false;
        }

        return true;
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
          const mReject = _.cloneDeep(oViewModel.getProperty('/buttons/form'));
          const aStrategy = _.cloneDeep(oViewModel.getProperty('/goals/strategy'));
          const aDuty = _.cloneDeep(oViewModel.getProperty('/goals/duty'));
          const bIsSave = _.isEqual(code, Constants.PROCESS_TYPE.SAVE.code);

          await Client.deep(oModel, 'AppraisalDoc', {
            ...mParameter,
            ...mManage,
            ...mSummary,
            ...mReject,
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

      onChangeScore(oEvent) {
        const oViewModel = this.getViewModel();
        const { sProp, sTarget } = oEvent.getSource().data();
        const aGoals = [...oViewModel.getProperty('/goals/strategy'), ...oViewModel.getProperty('/goals/duty')];

        oViewModel.setProperty(
          `/summary/${sTarget}`,
          _.chain(aGoals)
            .reduce((acc, cur) => _.add(acc, _.defaultTo(_.multiply(cur.Fwgt, cur[sProp]), 0)), 0)
            .divide(100)
            .floor(2)
            .value()
        );
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

        if (!this.validation()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', mProcessType.label), {
          // {승인}하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            this.createProcess(mProcessType);
          },
        });
      },

      onPressCheckedButton() {
        if (!this.validation()) return;

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
        const mProcessType = Constants.PROCESS_TYPE.SEND;

        if (!this.validation()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', mProcessType.label), {
          // {전송}하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            this.createProcess(mProcessType);
          },
        });
      },

      onPressCompleteButton() {
        if (!this.validation()) return;

        MessageBox.alert('Not ready yet.');
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);