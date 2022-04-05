sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/DateUtils',
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
    MessageBox,
    AppUtils,
    ComboEntry,
    DateUtils,
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

      initializeGoalItem(obj) {
        return {
          rootPath: _.chain(Constants.GOAL_TYPE).findKey({ code: obj.Z101 }).toLower().value(),
          expanded: _.stubTrue(),
          ..._.chain(obj).omit('AppraisalCoDoc').omit('__metadata').value(),
          ..._.chain(Constants.COMBO_PROPERTIES)
            .reduce((acc, cur) => ({ ...acc, [cur]: _.isEmpty(obj[cur]) ? 'ALL' : obj[cur] }), _.stubObject())
            .value(),
        };
      },

      initializeModel() {
        return {
          busy: false,
          param: {},
          type: '',
          year: moment().format('YYYY'),
          listInfo: {},
          appointee: {},
          tab: { selectedKey: Constants.TAB.ABILITY },
          stage: {
            headers: [],
            rows: [],
          },
          level: {
            expanded: false,
            type: 'level5',
            count: 5,
            headers: [],
            rows: [],
          },
          entry: {
            levels: [],
          },
          buttons: {
            submit: {},
            form: {
              Rjctr: '',
              Rjctrin: '',
              confirmEnable: false,
              isRejectProcess: false,
            },
          },
          fieldControl: {
            display: _.reduce([...Constants.GOAL_PROPERTIES, ...Constants.SUMMARY_PROPERTIES, ...Constants.REJECT_PROPERTIES], this.initializeFieldsControl.bind(this), {}),
            limit: {},
          },
          goals: {
            valid: [],
            header: {},
            common: [],
            duty: [],
          },
        };
      },

      onBeforeShow() {
        this.renderStageClass();
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oViewModel = this.getViewModel();
        const { sType, sYear } = oParameter;
        const mListRoute = _.find(Constants.LIST_PAGE, { detail: sRouteName });

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);
        oViewModel.setProperty('/listInfo', mListRoute);

        try {
          const oView = this.getView();
          const oListView = oView.getParent().getPage(mListRoute.id);

          if (_.isEmpty(oListView) || _.isEmpty(oListView.getModel().getProperty('/parameter/rowData'))) {
            throw new UI5Error({ code: 'E', message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
          }

          const mParameter = _.chain(oListView.getModel().getProperty('/parameter/rowData')).cloneDeep().omit('__metadata').value();
          const { Elementqid: sElementqid, Zzapsts: sZzapsts, ZzapstsSub: sZzapstsSub, Zonlydsp: sZonlydsp } = mParameter;

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
            aScales,
            mDetailData,
          ] = await Promise.all([
            fCurriedGetEntitySet('AppStatusStepList', { Werks: this.getSessionProperty('Werks'), Zzappid: mParameter.Zzappid, Zzappty: '20' }),
            fCurriedGetEntitySet('AppValueList', { VClass: 'Q', VType: '702' }),
            fCurriedGetEntitySet('CompAppStatScale', { Objid: sElementqid, Datum: DateUtils.parse(new Date()) }),
            Client.deep(oModel, 'AppraisalCoDoc', {
              ...mParameter,
              Menid: this.getCurrentMenuId(),
              Prcty: Constants.PROCESS_TYPE.DETAIL.code,
              Zzappgb: sType,
              AppraisalCoDocDetSet: [],
              AppraisalBottnsSet: [],
              AppraisalScreenSet: [],
            }),
          ]);

          // Combo Entry
          oViewModel.setProperty('/entry/levels', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aGrades }) ?? []);

          // Header
          oViewModel.setProperty('/summary', { ..._.pick(mDetailData, Constants.SUMMARY_PROPERTIES) });

          // 평가 프로세스 목록 - 헤더
          let bCompleted = true;
          const mGroupStageByApStatusSub = _.groupBy(aStepList, 'ApStatusSub');
          const aStageHeader = _.map(mGroupStageByApStatusSub[''], (o) => {
            const mReturn = { ..._.omit(o, '__metadata'), completed: bCompleted };
            if (_.isEqual(o.ApStatus, sZzapsts)) bCompleted = false;
            return mReturn;
          });

          if (_.isEqual(`${sZzapsts}${sZzapstsSub}`, '5X')) {
            _.chain(aStageHeader).last().set('completed', true).commit();
          }

          // 평가 프로세스 목록 - 하위
          bCompleted = true;
          const aGroupStageByApStatusName = _.chain(aStepList)
            .filter((o) => !_.isEqual(o.ApStatusSub, ''))
            .groupBy('ApStatus')
            .reduce((acc, cur) => [...acc, [...cur]], _.stubArray())
            .map((item) =>
              _.map(item, (o) => {
                const mReturn = { ..._.omit(o, '__metadata'), completed: bCompleted };
                if (_.isEqual(o.ApStatus, sZzapsts) && _.isEqual(o.ApStatusSub, sZzapstsSub)) bCompleted = false;
                return mReturn;
              })
            )
            .value();

          // 평가 단계 - 하위 평가완료(5-X)는 숨김처리
          oViewModel.setProperty('/stage/headers', aStageHeader);
          oViewModel.setProperty(
            '/stage/rows',
            _.chain(mGroupStageByApStatusSub[''])
              .map((o, i) => ({ child: _.map(aGroupStageByApStatusName[i], (o) => ({ ...o, visible: !_.isEqual('X', o.ApStatusSub) })) }))
              .value()
          );

          // 행동지표 수준 정의
          const mLevel = oViewModel.getProperty('/level');
          _.chain(mLevel)
            .set('type', `level${aScales.length}`)
            .set('count', aScales.length)
            .set(
              'headers',
              _.reduce(aScales, (acc, cur) => [...acc, { type: 'body', label: cur.Pstext.substring(0, 7), text: _.replace(cur.Pstext, cur.Pstext.substring(0, 8), '') }], [{ type: 'head', text: this.getBundleText('LABEL_22006') }])
            )
            .set('rows', [
              ..._.reduce(aScales, (acc, cur) => [...acc, { type: 'body', child: [{ text: cur.Steptext }] }], [{ type: 'head', child: [{ text: this.getBundleText('LABEL_22007') }] }]), //
              ..._.chain(aScales)
                .reduce(
                  (acc, cur) => [
                    ...acc,
                    {
                      type: 'body',
                      child: _.chain(cur)
                        .pickBy((v, p) => _.startsWith(p, 'Note') && !_.isEmpty(v))
                        .map((v) => ({ text: v }))
                        .value(),
                    },
                  ],
                  [{ type: 'head', child: [{ text: this.getBundleText('LABEL_22008') }] }]
                )
                .map((o) => ({ ...o, type: _.isEmpty(o.child) ? 'blank' : o.type }))
                .value(),
            ])
            .commit();

          // 기능버튼
          const mButtons = oViewModel.getProperty('/buttons');
          _.chain(mButtons)
            .tap((o) => _.set(o, ['form', 'Rjctr'], _.get(mDetailData, 'Rjctr', _.noop())))
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

          // 필드 컨트롤
          const mConvertScreen = _.chain(mDetailData.AppraisalScreenSet.results)
            .reduce((acc, cur) => ({ ...acc, [_.capitalize(cur.ColumnId)]: cur.Zdipopt }), oViewModel.getProperty('/fieldControl/display'))
            .forOwn((value, key, object) => {
              if (_.has(Constants.FIELD_MAPPING, key)) {
                _.forEach(_.get(Constants.FIELD_MAPPING, key), (subKey) => _.set(object, subKey, _.get(Constants.FIELD_STATUS_MAP, [sZzapsts, sZzapstsSub, subKey, sType], value)));
              }
            })
            .value();

          // 조회모드
          if (_.isEqual(sZonlydsp, 'X')) {
            _.chain(mButtons.submit)
              .filter({ process: true })
              .forEach((v) => _.set(v, 'Availability', ''))
              .commit();

            _.forEach(mConvertScreen, (v, p) => {
              if (_.isEqual(v, Constants.DISPLAY_TYPE.EDIT)) _.set(mConvertScreen, p, Constants.DISPLAY_TYPE.DISPLAY_ONLY);
            });
          }

          // 목표(공통/직무)
          const mGroupDetailByZvbgubun = _.groupBy(mDetailData.AppraisalCoDocDetSet.results, 'Zvbgubun');

          _.forEach(Constants.GOAL_TYPE, (v) => oViewModel.setProperty(`/goals/${v.name}`, _.map(mGroupDetailByZvbgubun[v.code], this.initializeGoalItem.bind(this)) ?? []));
          oViewModel.setProperty(
            '/goals/valid',
            _.chain(Constants.VALIDATION_PROPERTIES)
              .filter((o) => _.isEqual(_.get(mConvertScreen, o.field), Constants.DISPLAY_TYPE.EDIT))
              .map((o) => ({ ...o, label: this.getBundleText(o.label) }))
              .value()
          );

          // 필드속성
          oViewModel.setProperty('/fieldControl/display', mConvertScreen);
          oViewModel.setProperty('/fieldControl/limit', _.assignIn(this.getEntityLimit(ServiceNames.APPRAISAL, 'AppraisalCoDoc'), this.getEntityLimit(ServiceNames.APPRAISAL, 'AppraisalCoDocDet')));
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
          const [mAppointee] = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', { Ename: sPernr });

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
        const aCommonGoals = _.cloneDeep(oViewModel.getProperty('/goals/common'));
        const aDutyGoals = _.cloneDeep(oViewModel.getProperty('/goals/duty'));
        const mSummary = _.cloneDeep(oViewModel.getProperty('/summary'));
        const aValid = _.cloneDeep(oViewModel.getProperty('/goals/valid'));
        const aGoalValid = _.filter(aValid, (o) => _.includes(Constants.GOAL_PROPERTIES, o.field));
        const aSummaryValid = _.filter(aValid, (o) => _.includes(Constants.SUMMARY_PROPERTIES, o.field));

        if (_.some(aCommonGoals, (mFieldValue) => !Validator.check({ mFieldValue, aFieldProperties: aGoalValid, sPrefixMessage: `[${_.truncate(mFieldValue.Obj0)}]의` })) || _.some(aDutyGoals, (mFieldValue) => !Validator.check({ mFieldValue, aFieldProperties: _.reject(aGoalValid, { field: 'Z103s' }), sPrefixMessage: `[${_.truncate(mFieldValue.Obj0)}]의` }))) {
          this.changeTab(Constants.TAB.ABILITY);
          return false;
        }
        if (!Validator.check({ mFieldValue: mSummary, aFieldProperties: aSummaryValid })) {
          this.changeTab(Constants.TAB.OPINION);
          return false;
        }

        return true;
      },

      async createProcess({ code, label }) {
        const oViewModel = this.getViewModel();
        const sListRouteName = oViewModel.getProperty('/listInfo/route');

        oViewModel.setProperty('/busy', true);

        try {
          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const mParameter = _.cloneDeep(oViewModel.getProperty('/param'));
          const mSummary = _.cloneDeep(oViewModel.getProperty('/summary'));
          const mReject = _.cloneDeep(oViewModel.getProperty('/buttons/form'));
          const aCommon = _.cloneDeep(oViewModel.getProperty('/goals/common'));
          const aDuty = _.cloneDeep(oViewModel.getProperty('/goals/duty'));
          const bIsSave = _.isEqual(code, Constants.PROCESS_TYPE.SAVE.code);

          await Client.deep(oModel, 'AppraisalCoDoc', {
            ...mParameter,
            ...mSummary,
            ...mReject,
            Menid: this.getCurrentMenuId(),
            Prcty: code,
            AppraisalCoDocDetSet: [...aCommon, ...aDuty],
          });

          // {저장|전송|승인|완료|취소}되었습니다.
          await MessageBox.success(this.getBundleText('MSG_00007', label), {
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
      onChangeScore(oEvent) {
        const oViewModel = this.getViewModel();
        const { sRoot, sProp, sTarget, sTotTarget } = oEvent.getSource().data();
        const aGoals = [...oViewModel.getProperty('/goals/common'), ...oViewModel.getProperty('/goals/duty')];
        const aGroupGoals = [...oViewModel.getProperty(`/goals/${sRoot}`)];

        oViewModel.setProperty(
          `/summary/${sTotTarget}`,
          _.chain(aGoals)
            .reduce((acc, cur) => _.add(acc, _.defaultTo(_.multiply(1, cur[sProp]), 0)), 0)
            .divide(aGoals.length)
            .floor(2)
            .value()
        );
        oViewModel.setProperty(
          `/summary/${sTarget}`,
          _.chain(aGroupGoals)
            .reduce((acc, cur) => _.add(acc, _.defaultTo(_.multiply(1, cur[sProp]), 0)), 0)
            .divide(aGroupGoals.length)
            .floor(2)
            .value()
        );
      },

      onCheckReject(oEvent) {
        this.getViewModel().setProperty('/buttons/form/confirmEnable', !!oEvent.getSource().getValue());
      },

      onPressRejectViewButton() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/buttons/form/isRejectProcess', false);
        this.openRejectDialog();
      },

      onPressRejectDialogClose() {
        this.byId('rejectDialog').close();
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
          // {전송취소}하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            this.createProcess(mProcessType);
          },
        });
      },

      onPressCancelComplButton() {
        const mProcessType = Constants.PROCESS_TYPE.CANCEL_COMPLETE;

        MessageBox.confirm(this.getBundleText('MSG_00006', mProcessType.label), {
          // {확정취소}하시겠습니까?
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
        const mProcessType = Constants.PROCESS_TYPE.COMPLETE;

        if (!this.validation()) return;

        MessageBox.confirm(this.getBundleText('MSG_00006', mProcessType.label), {
          // {완료}하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            this.createProcess(mProcessType);
          },
        });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
