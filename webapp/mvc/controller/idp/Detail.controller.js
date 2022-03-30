sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/Validator',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/idp/constant/Constants',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Percent',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    MessageBox,
    Appno,
    AppUtils,
    AttachFileAction,
    ComboEntry,
    Client,
    UI5Error,
    ServiceNames,
    Validator,
    BaseController,
    Constants
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.idp.Detail', {
      getPreviousRouteName() {
        return _.chain(this.getRouter().getHashChanger().getHash()).split('/').dropRight(2).join('/').value();
      },

      getCurrentLocationText(oArguments) {
        return oArguments.sYear ?? moment().format('YYYY');
      },

      initializeFieldsControl(acc, cur) {
        return { ...acc, [cur]: Constants.DISPLAY_TYPE.EDIT };
      },

      initializeItem(obj, index) {
        return {
          expanded: _.stubFalse(),
          isSaved: _.stubTrue(),
          OrderNo: String(index),
          ItemNo: String(index + 1),
          ..._.chain(obj).omit('__metadata').value(),
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
          tab: { selectedKey: Constants.TAB.COMP },
          listInfo: {},
          appointee: {},
          entry: { levels: [], competency: [] },
          stage: {
            headers: [],
            rows: [],
          },
          currentItemsLength: 0,
          goals: {
            comp: [],
          },
          buttons: {
            submit: {},
            goal: { ADD: { Availability: false }, DELETE: { Availability: false } },
            form: {
              Rjctr: '',
              Rjctrin: '',
              confirmEnable: false,
              isRejectProcess: false,
              Zzapper2: '',
              Zdocid2: '',
            },
          },
          fieldControl: {
            display: _.reduce([...Constants.ITEM_PROPERTIES, ...Constants.MANAGE_PROPERTIES, ...Constants.REJECT_PROPERTIES], this.initializeFieldsControl.bind(this), {}),
            limit: {},
          },
        };
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
          const { Zzapsts: sZzapsts, ZzapstsSub: sZzapstsSub, Zonlydsp: sZonlydsp } = mParameter;

          this.setAppointee(sType, mParameter.Zzappee);

          _.chain(mParameter).set('OldStatus', mParameter.Zzapsts).set('OldStatusSub', mParameter.ZzapstsSub).set('OldStatusPart', mParameter.ZzapstsPSub).commit();
          oViewModel.setProperty('/param', { ...mParameter });
          oViewModel.setProperty('/type', sType);
          oViewModel.setProperty('/year', sYear);

          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const fCurriedGetEntitySet = Client.getEntitySet(oModel);
          const [aStepList, aGrades, mDetailData] = await Promise.all([
            fCurriedGetEntitySet('AppStatusStepList', { Werks: this.getSessionProperty('Werks'), Zzappid: mParameter.Zzappid, Zzappty: mParameter.Zzappty }),
            fCurriedGetEntitySet('AppGradeList'),
            Client.deep(oModel, 'AppraisalIdpDoc', {
              ...mParameter,
              Menid: this.getCurrentMenuId(),
              Prcty: Constants.PROCESS_TYPE.DETAIL.code,
              Zzappgb: sType,
              AppraisalIdpDocDetSet: [],
              AppraisalBottnsSet: [],
              AppraisalScreenSet: [],
            }),
          ]);

          // Combo Entry
          oViewModel.setProperty('/entry/levels', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aGrades }) ?? []);

          // 팀장의견
          oViewModel.setProperty('/manage', { ..._.pick({ ...mDetailData }, Constants.MANAGE_PROPERTIES) });

          // 평가 프로세스 목록 - 헤더
          let bCompleted = true;
          const mGroupStageByApStatusSub = _.groupBy(aStepList, 'ApStatusSub');
          const aStageHeader = _.map(mGroupStageByApStatusSub[''], (o) => {
            const mReturn = { ..._.omit(o, '__metadata'), completed: bCompleted };
            if (_.isEqual(o.ApStatus, sZzapsts)) bCompleted = false;
            return mReturn;
          });

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

          // 직무역량
          oViewModel.setProperty(`/goals/comp`, _.map(mDetailData.AppraisalIdpDocDetSet.results, this.initializeItem.bind(this)) ?? []);
          oViewModel.setProperty('/currentItemsLength', _.size(mDetailData.AppraisalIdpDocDetSet.results));
          oViewModel.setProperty(
            '/goals/valid',
            _.chain(Constants.VALIDATION_PROPERTIES)
              .filter((o) => _.isEqual(_.get(mConvertScreen, o.field), Constants.DISPLAY_TYPE.EDIT))
              .map((o) => ({ ...o, label: this.getBundleText(o.label) }))
              .value()
          );

          // 필드속성
          oViewModel.setProperty('/fieldControl/display', mConvertScreen);
          oViewModel.setProperty('/fieldControl/limit', _.assignIn(this.getEntityLimit(ServiceNames.APPRAISAL, 'AppraisalIdpDoc'), this.getEntityLimit(ServiceNames.APPRAISAL, 'AppraisalIdpDocDet')));
        } catch (oError) {
          this.debug(`Controller > ${mListRoute.route} Detail > onObjectMatched Error`, oError);

          AppUtils.handleError(oError, {
            onClose: () => this.onNavBack(),
          });
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onBeforeShow() {
        this.renderStageClass();
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

      async openCompetencyHelpDialog() {
        const oView = this.getView();

        if (!this.pCompetencyDialog) {
          this.pCompetencyDialog = await Fragment.load({
            id: oView.getId(),
            controller: this,
            name: 'sap.ui.yesco.mvc.view.idp.fragment.CompetencyDialog',
          });

          oView.addDependent(this.pCompetencyDialog);
        }

        this.pCompetencyDialog.open();
      },

      onSearchDialogHelp(oEvent) {
        oEvent.getParameter('itemsBinding').filter([
          new Filter('Stext', FilterOperator.Contains, oEvent.getParameter('value')), //
        ]);
      },

      async onCloseDialogHelp(oEvent) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          const aItems = oViewModel.getProperty('/goals/comp');
          const mSelectedData = oEvent.getParameter('selectedItem').getBindingContext().getObject();

          if (_.some(aItems, (o) => _.isEqual(o.Zobjidq, mSelectedData.Zobjidq))) {
            throw new UI5Error({ code: 'A', message: this.getBundleText('MSG_36001') }); // 이미 선택한 역량입니다.
          }

          const mParameter = oViewModel.getProperty('/param');
          const sType = oViewModel.getProperty('/type');
          const mResult = await Client.deep(this.getModel(ServiceNames.APPRAISAL), 'AppraisalIdpDoc', {
            ...mParameter,
            Menid: this.getCurrentMenuId(),
            Prcty: Constants.PROCESS_TYPE.DETAIL.code,
            Zzappgb: sType,
            AppraisalIdpDocDetSet: [{ Obj0: mSelectedData.Stext }],
            AppraisalBottnsSet: [],
            AppraisalScreenSet: [],
          });
          const iItemsLength = aItems.length;
          let iCurrentItemsLength = oViewModel.getProperty('/currentItemsLength') ?? 0;

          oViewModel.setProperty('/currentItemsLength', ++iCurrentItemsLength);
          oViewModel.setProperty('/goals/comp', [
            ...aItems,
            {
              ..._.reduce(Constants.ITEM_PROPERTIES, (acc, cur) => ({ ...acc, [cur]: _.includes(Constants.COMBO_PROPERTIES, cur) ? 'ALL' : _.noop() }), _.stubObject()),
              expanded: _.stubTrue(),
              isSaved: _.stubFalse(),
              OrderNo: String(iItemsLength),
              ItemNo: String(iItemsLength + 1),
              Obj0: mSelectedData.Stext,
              Zobjidq: mSelectedData.Zobjidq,
              Z301: _.get(mResult, ['AppraisalIdpDocDetSet', 0, 'Z301'], 'ALL'),
            },
          ]);
        } catch (oError) {
          this.debug('Controller > IDP Detail > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async addCompItem() {
        const oViewModel = this.getViewModel();
        const aCompetency = oViewModel.getProperty('/entry/competency');
        let iCurrentItemsLength = oViewModel.getProperty('/currentItemsLength') ?? 0;

        if (iCurrentItemsLength === 3) {
          MessageBox.alert(this.getBundleText('MSG_10002')); // 더 이상 추가 할 수 없습니다.
          return;
        }

        if (_.isEmpty(aCompetency)) {
          const mParam = oViewModel.getProperty('/param');
          const aResults = await Client.getEntitySet(this.getModel(ServiceNames.APPRAISAL), 'AppraisalIdpQlist', {
            Prcty: 'L',
            Werks: this.getAppointeeProperty('Werks'),
            ..._.pick(mParam, ['Zzappid', 'Zdocid', 'Zzappty']),
          });

          oViewModel.setProperty(
            '/entry/competency',
            _.map(aResults, (o) => _.omit(o, '__metadata'))
          );
        }

        this.openCompetencyHelpDialog();
      },

      onPressDeleteGoal(oEvent) {
        const oViewModel = this.getViewModel();
        const oSource = oEvent.getSource();

        // 삭제하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00049'), {
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            const { sDeleteTargetNum } = oSource.data();
            const aGoalItems = oViewModel.getProperty(`/goals/comp`);
            const bIsSavedGoalItem = _.chain(aGoalItems).find({ OrderNo: sDeleteTargetNum }).get('isSaved').value();
            let iCurrentItemsLength = oViewModel.getProperty('/currentItemsLength') ?? 0;

            oViewModel.setProperty('/currentItemsLength', --iCurrentItemsLength);
            oViewModel.setProperty(
              `/goals/comp`,
              _.chain(aGoalItems)
                .reject({ OrderNo: sDeleteTargetNum })
                .map((o, i) => ({ ...o, OrderNo: String(i), ItemNo: String(i + 1) }))
                .value()
            );

            if (bIsSavedGoalItem) MessageBox.success(this.getBundleText('MSG_10004')); // 저장 버튼을 클릭하여 삭제를 완료하시기 바랍니다.
          },
        });
      },

      onPressRejectViewButton() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/buttons/form/isRejectProcess', false);
        this.openRejectDialog();
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

      onPressRejectButton() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/buttons/form/isRejectProcess', true);
        this.openRejectDialog();
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
    });
  }
);
