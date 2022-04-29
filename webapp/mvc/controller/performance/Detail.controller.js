sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/Validator',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/performance/constant/Constants',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    MessageBox,
    Appno,
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

      initializeModel() {
        return {
          busy: false,
          param: {},
          type: '',
          year: moment().format('YYYY'),
          listInfo: {},
          tab: { selectedKey: Constants.TAB.GOAL },
          appointee: {},
          jobDiagnosis: {
            // 진단평가 팝업
            codeList1: [],
            codeList2: [],
            deep: [
              {
                spanCount: 1,
                bTitle: true,
                bSubTitle: true,
                Appgb: '',
                Appgbtx: '',
                Zbigo: '',
                Zcheck: '',
                Zcode: '',
                Zzjaitm: '',
                Zzjaitmtx: '',
                Zzjarst: '',
                Zzjarsttx: '',
              },
            ],
          },
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
          opposition: {
            Appno: '',
            ZzabjfbTx: '',
            param: {},
            files: [],
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
          const { Zzapsts: sZzapsts, ZzapstsSub: sZzapstsSub, ZzapstsPSub: sZzapstsPSub, Zonlydsp: sZonlydsp } = mParameter;
          // 4-1 평가실시 - 부분평가중일 경우 ZzapstsPSub가 A|B로 들어오면 1차평가중 상태로 변경한다.
          const sLogicalZzapstsSub = !_.isEmpty(sZzapstsPSub) ? sZzapstsPSub : sZzapstsSub;

          this.setAppointee(sType, mParameter.Zzappee);

          _.chain(mParameter).set('OldStatus', mParameter.Zzapsts).set('OldStatusSub', mParameter.ZzapstsSub).set('OldStatusPart', mParameter.ZzapstsPSub).commit();
          oViewModel.setProperty('/param', { ...mParameter });
          oViewModel.setProperty('/type', sType);
          oViewModel.setProperty('/year', sYear);

          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const fCurriedGetEntitySet = Client.getEntitySet(oModel);
          const [aStepList, aTopGoals, aStatus, aFinalStatus, aGrades, mDetailData] = await Promise.all([
            fCurriedGetEntitySet('AppStatusStepList', { Werks: this.getSessionProperty('Werks'), Zzappid: mParameter.Zzappid, Zzappty: mParameter.Zzappty }),
            fCurriedGetEntitySet('RelaUpTarget', { Zzappee: mParameter.Zzappee }),
            fCurriedGetEntitySet('AppValueList', { VClass: 'Q', VType: '807' }),
            fCurriedGetEntitySet('AppValueList', { VClass: 'Q', VType: '810' }),
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
          oViewModel.setProperty('/entry/statusF', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aFinalStatus }) ?? []);

          // 합계점수
          oViewModel.setProperty('/summary', {
            ..._.chain({ ...mDetailData })
              .pick(Constants.SUMMARY_PROPERTIES)
              .set('Zmbgrade', _.isEmpty(mDetailData.Lfapp) ? (_.isEmpty(mDetailData.Zmbgrade) ? 'ALL' : mDetailData.Zmbgrade) : mDetailData.Lfapp)
              .value(),
          });

          // 상시관리
          oViewModel.setProperty('/manage', { ..._.pick({ ...mDetailData }, Constants.MANAGE_PROPERTIES) });

          // 이의신청
          oViewModel.setProperty('/opposition/param', { ..._.pick({ ...mParameter }, Constants.OPPOSITION_PROPERTIES) });

          // 평가 프로세스 목록 - 헤더
          let bCompleted = true;
          const mGroupStageByApStatusSub = _.groupBy(aStepList, 'ApStatusSub');
          const aStageHeader = _.map(mGroupStageByApStatusSub[''], (o) => {
            const mReturn = { ..._.omit(o, '__metadata'), completed: bCompleted };
            if (_.isEqual(o.ApStatus, sZzapsts)) bCompleted = false;
            return mReturn;
          });

          if (_.isEqual(`${sZzapsts}${sLogicalZzapstsSub}`, '5X')) {
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
                if (_.isEqual(o.ApStatus, sZzapsts) && _.isEqual(o.ApStatusSub, sLogicalZzapstsSub)) bCompleted = false;
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
                _.forEach(_.get(Constants.FIELD_MAPPING, key), (subKey) => _.set(object, subKey, _.get(Constants.FIELD_STATUS_MAP, [sZzapsts, sLogicalZzapstsSub, subKey, sType], value)));
              }
            })
            .value();

          // 기능버튼
          _.chain(mButtons)
            .set(['form', 'Zdocid2'], _.get(mDetailData, 'Zdocid2'))
            .set(['form', 'Zzapper2'], _.get(mDetailData, 'Zzapper2'))
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
                .get([sZzapsts, sLogicalZzapstsSub])
                .omitBy({ standard: true })
                .forOwn((v, k) =>
                  _.chain(o.submit)
                    .set([k, 'Availability'], _.get(v, sType))
                    .set([k, 'ButtonText'], this.getBundleText(_.get(v, 'label')))
                    .set([k, 'process'], _.get(v, 'process', _.stubFalse()))
                    .commit()
                )
                .commit();
            })
            .tap((o) => {
              _.chain(Constants.BUTTON_STATUS_MAP)
                .get([sZzapsts, sLogicalZzapstsSub])
                .pickBy({ standard: true })
                .forOwn((v, k) => _.set(o.submit, [k, 'Availability'], _.get(v, sType, _.get(o.submit, [k, 'Availability'], ''))))
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

            if (_.isEqual(sType, Constants.APPRAISER_TYPE.MA) && (_.isEqual(['2', 'D'], [sZzapsts, sLogicalZzapstsSub]) || _.isEqual(['3', 'H'], [sZzapsts, sLogicalZzapstsSub]))) {
              _.set(mConvertScreen, 'Z140', Constants.DISPLAY_TYPE.EDIT);
            }
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

      async setAppointee(sType, sPernr) {
        const oViewModel = this.getViewModel();

        if (_.isEqual(sType, Constants.APPRAISER_TYPE.ME)) {
          oViewModel.setProperty('/appointee', AppUtils.getAppComponent().getAppointeeModel().getData());
        } else {
          const [mAppointee] = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
            Ename: sPernr,
          });

          oViewModel.setProperty('/appointee', { ...mAppointee, Orgtx: mAppointee.Fulln, Photo: mAppointee.Photo || this.getUnknownAvatarImageURL() });
        }
      },

      changeTab(sTabKey) {
        this.getViewModel().setProperty('/tab/selectedKey', sTabKey);
      },

      onDialogClose(oEvent) {
        oEvent.getSource().getParent().close();
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
            name: 'sap.ui.yesco.mvc.view.performance.fragment.RejectDialog',
            controller: this,
          }).then((oDialog) => {
            oView.addDependent(oDialog);
            return oDialog;
          });
        }
        this.pRejectDialog.then((oDialog) => oDialog.open());
      },

      async initializeAttachBox(bEditable) {
        const oViewModel = this.getViewModel();
        const sListRouteName = oViewModel.getProperty('/listInfo/route');

        try {
          const mOpposition = _.cloneDeep(oViewModel.getProperty('/opposition/param'));
          const [mResult] = await Client.getEntitySet(this.getModel(ServiceNames.APPRAISAL), 'AppraisalDifOpi', {
            Menid: this.getCurrentMenuId(),
            Prcty: 'D',
            ...mOpposition,
          });
          const sAppno = _.get(mResult, 'Appno');

          oViewModel.setProperty('/opposition/Appno', _.isEmpty(sAppno) || _.toNumber(sAppno) === 0 ? null : sAppno);
          oViewModel.setProperty('/opposition/ZzabjfbTx', _.get(mResult, 'ZzabjfbTx'));

          this.AttachFileAction.setAttachFile(this, {
            Editable: bEditable,
            Type: 'APP1',
            Appno: oViewModel.getProperty('/opposition/Appno'),
            LinkText: this.getBundleText('LABEL_10100'),
            LinkUrl: 'https://www.google.com',
            Max: 2,
            // FileTypes: 'jpg,jpeg,pdf,doc,docx,ppt,pptx,xls,xlsx,bmp,png'.split(','),
          });
        } catch (oError) {
          this.debug(`Controller > ${sListRouteName} Detail > initializeAttachBox Error`, oError);

          AppUtils.handleError(oError, {
            onClose: () => this.pOppositionDialog.close(),
          });
        }
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
        const sListRouteName = oViewModel.getProperty('/listInfo/route');

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

          // {저장|전송|승인|취소|완료}되었습니다.
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

      async createOppositionProcess(sPrcty) {
        const oViewModel = this.getViewModel();
        const sListRouteName = oViewModel.getProperty('/listInfo/route');

        oViewModel.setProperty('/busy', true);

        try {
          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const mOpposition = _.cloneDeep(oViewModel.getProperty('/opposition/param'));
          let sAppno = oViewModel.getProperty('/opposition/Appno');

          if (_.isEqual(sPrcty, 'C')) {
            if (_.isEmpty(sAppno)) {
              sAppno = await Appno.get();
              oViewModel.setProperty('/opposition/Appno', sAppno);
            }

            await this.AttachFileAction.uploadFile.call(this, sAppno, 'APP1');
          }

          await Client.getEntitySet(oModel, 'AppraisalDifOpi', {
            Menid: this.getCurrentMenuId(),
            Prcty: sPrcty,
            ButtonId: _.isEqual(sPrcty, 'C') ? 'Z_ABJCTN' : 'Z_ICHKED',
            ...mOpposition,
            Appno: sAppno,
          });

          // {이의신청|이의신청철회}되었습니다.
          MessageBox.success(this.getBundleText('MSG_00007', _.isEqual(sPrcty, 'C') ? 'LABEL_10035' : 'LABEL_10101'), {
            onClose: () => this.getRouter().navTo(sListRouteName),
          });
        } catch (oError) {
          this.debug(`Controller > ${sListRouteName} Detail > createOppositionProcess Error`, oError);

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

      // 직무진단
      async onPressDiagnosisButton() {
        MessageBox.alert('Not ready yet.');
        // const oViewModel = this.getViewModel();

        // try {
        //   oViewModel.setProperty('/busy', true);

        //   const oView = this.getView();
        //   const aDeep = await this.getJobDiagnosis();
        //   const aDeepData = _.chain(aDeep.JobDiagnosisItemSet.results)
        //     .groupBy('Appgbtx')
        //     .toPairs()
        //     .map((e) => {
        //       return [{ label: e[0], bTitle: false, bSubTitle: true, spanCount: `span ${_.toString(_.size(e[1]))}` }, ...e[1]];
        //     })
        //     .flatten()
        //     .value();

        //   oViewModel.setProperty('/jobDiagnosis/deep', [
        //     // prettier
        //     { label: this.getBundleText('LABEL_00147'), bTitle: true, bSubTitle: false },
        //     { label: this.getBundleText('LABEL_10103'), bTitle: true, bSubTitle: false },
        //     { label: this.getBundleText('LABEL_10104'), bTitle: true, bSubTitle: false },
        //     { label: this.getBundleText('LABEL_10105'), bTitle: true, bSubTitle: false },
        //     ...aDeepData,
        //   ]);
        //   debugger;

        //   if (!this.pExamDialog) {
        //     this.pExamDialog = Fragment.load({
        //       id: oView.getId(),
        //       name: 'sap.ui.yesco.mvc.view.performance.fragment.JobExamination',
        //       controller: this,
        //     }).then((oDialog) => {
        //       oView.addDependent(oDialog);
        //       return oDialog;
        //     });
        //   }
        //   this.pExamDialog.then((oDialog) => oDialog.open());
        // } catch (oError) {
        //   AppUtils.handleError(oError);
        // } finally {
        //   oViewModel.setProperty('/busy', false);
        // }
      },

      // 직무진단 조회
      getJobDiagnosis() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);

        return Client.deep(oModel, 'JobDiagnosis', {
          Mode: 'A',
          ...this.getViewModel().getProperty('/param'),
          JobDiagnosisItemSet: [],
        });
      },

      // 직무진단 Code
      getJobDiagnosisCode1() {
        const oModel = this.getModel(ServiceNames.APPRAISAL);

        return Client.getEntitySet(oModel, 'JobDiagnosisCode1', {
          Mode: 'A',
          ...this.getViewModel().getProperty('/param'),
          JobDiagnosisItemSet: [],
        });
      },

      onPressRejectViewButton() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/buttons/form/isRejectProcess', false);
        this.openRejectDialog();
      },

      onPressRejectDialogClose() {
        this.byId('rejectDialog').close();
      },

      onCheckReject(oEvent) {
        this.getViewModel().setProperty('/buttons/form/confirmEnable', !!oEvent.getSource().getValue());
      },

      onPressTopGoal() {
        const oViewModel = this.getViewModel();
        const sHost = window.location.href.split('#')[0];
        const sType = oViewModel.getProperty('/type');
        const { Zzapper2: sPernr, Zdocid2: sDocid } = oViewModel.getProperty('/buttons/form');

        window.open(`${sHost}#/performanceView/${sType}/${sPernr}/${sDocid}`, '_blank', 'width=1400,height=800');
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
        MessageBox.confirm(this.getBundleText('MSG_10024'), {
          // 이의신청을 철회하고, 성과평가를 완료 하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            this.createOppositionProcess('W');
          },
        });
      },

      async onPressOppositionButton() {
        const oView = this.getView();

        if (!this.pOppositionDialog) {
          this.pOppositionDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.performance.fragment.OppositionDialog',
            controller: this,
          });

          this.pOppositionDialog.attachAfterOpen(() => {
            this.initializeAttachBox(true);
          });

          oView.addDependent(this.pOppositionDialog);
        }

        this.pOppositionDialog.open();
      },

      onPressOppositionDialogSave() {
        const iAttachLength = this.AttachFileAction.getFileCount.call(this);

        if (iAttachLength < 1) {
          MessageBox.alert(this.getBundleText('MSG_10023')); // 이의신청서를 첨부하세요.
          return;
        }

        MessageBox.confirm(this.getBundleText('MSG_10022'), {
          // 성과평가 결과에 대해 이의신청 하시겠습니까?
          onClose: (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) return;

            this.createOppositionProcess('C');
          },
        });
      },

      onPressOppositionDialogClose() {
        this.pOppositionDialog.close();
      },

      async onPressOppositionViewButton() {
        const oView = this.getView();

        if (!this.pOppositionViewDialog) {
          this.pOppositionViewDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.performance.fragment.OppositionViewDialog',
            controller: this,
          });

          this.pOppositionViewDialog.attachAfterOpen(async () => {
            this.initializeAttachBox(false);
          });

          oView.addDependent(this.pOppositionViewDialog);
        }

        this.pOppositionViewDialog.open();
      },

      onPressOppositionViewDialogClose() {
        this.pOppositionViewDialog.close();
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
