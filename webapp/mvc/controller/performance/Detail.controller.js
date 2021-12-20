sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    MessageBox,
    AppUtils,
    ComboEntry,
    Client,
    UI5Error,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.Detail', {
      LIST_PAGE_ID: 'container-ehr---performance',

      SUMMARY_PROPERTIES: ['Zmepoint', 'Zmapoint', 'Zmbgrade'],
      MANAGE_PROPERTIES: ['Z131', 'Z132', 'Z136', 'Z137', 'Z140', 'Papp1', 'Papp2'],
      GOAL_PROPERTIES: ['Obj0', 'Fwgt', 'Z101', 'Z103', 'Z103s', 'Z109', 'Z111', 'Zapgme', 'Zapgma', 'Ztbegda', 'Ztendda', 'Zmarslt', 'Zrslt', 'Z1175', 'Z1174', 'Z1173', 'Z1172', 'Z1171', 'Z125Ee', 'Z125Er'],
      COMBO_PROPERTIES: ['Zapgme', 'Zapgma', 'Z103s', 'Z111', 'Zmbgrade'],

      DISPLAY_TYPE: { EDIT: 'X', DISPLAY_ONLY: 'D', HIDE: 'H', HIDDEN_VALUE: 'V' },
      GOAL_TYPE: { STRATEGY: { code: '1', name: 'strategy' }, DUTY: { code: '2', name: 'duty' } },
      APPRAISER_TYPE: { ME: 'ME', MA: 'MA', MB: 'MB' },

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
          OrderNo: String(index),
          ItemNo: String(index + 1),
          ...obj,
        };
      },

      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          param: {},
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
          buttons: [],
          currentItemsLength: 0,
          fieldControl: {
            display: _.assignIn(
              _.reduce(this.GOAL_PROPERTIES, this.initializeFieldsControl.bind(this), {}),
              _.reduce(this.SUMMARY_PROPERTIES, this.initializeFieldsControl.bind(this), {}),
              _.reduce(this.MANAGE_PROPERTIES, this.initializeFieldsControl.bind(this), {})
            ),
            limit: {},
          },
          goals: {
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

        try {
          if (_.isEmpty(oListView) || _.isEmpty(oListView.getModel().getProperty('/parameter/rowData'))) {
            throw new UI5Error({ code: 'E', message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
          }

          const mParameter = _.omit(oListView.getModel().getProperty('/parameter/rowData'), '__metadata');

          oViewModel.setProperty('/busy', true);
          oViewModel.setProperty('/year', oParameter.year);
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
              Zzappgb: this.APPRAISER_TYPE.ME,
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

              if (mParameter.ZzapstsSub !== 'X' && o.ApStatus === mParameter.Zzapsts) bCompleted = false;

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
                if (o.ApStatus === mParameter.Zzapsts && o.ApStatusSub === mParameter.ZzapstsSub) bCompleted = false;
                return mReturn;
              })
            )
            .value();

          // 콤보박스 Entry
          oViewModel.setProperty('/entry/topGoals', new ComboEntry({ codeKey: 'Objid', valueKey: 'Stext', aEntries: aTopGoals }) ?? []);
          oViewModel.setProperty('/entry/levels', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aGrades }) ?? []);
          oViewModel.setProperty('/entry/status', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aStatus }) ?? []);

          // 합계점수
          oViewModel.setProperty('/summary', {
            ..._.chain({ ...mDetailData, Zmbgrade: _.isEmpty(mDetailData.Zmbgrade) ? 'ALL' : mDetailData.Zmbgrade })
              .pick(this.SUMMARY_PROPERTIES)
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
          oViewModel.setProperty('/goals/strategy', _.map(mGroupDetailByZ101[this.GOAL_TYPE.STRATEGY.code], this.initializeGoalItem.bind(this)) ?? []);
          oViewModel.setProperty('/goals/duty', _.map(mGroupDetailByZ101[this.GOAL_TYPE.DUTY.code], this.initializeGoalItem.bind(this)) ?? []);

          // 기능버튼
          oViewModel.setProperty('/buttons', mDetailData.AppraisalBottnsSet.results ?? []);

          // 필드속성
          oViewModel.setProperty('/fieldControl/limit', _.assignIn(this.getEntityLimit(ServiceNames.APPRAISAL, 'AppraisalDoc'), this.getEntityLimit(ServiceNames.APPRAISAL, 'AppraisalDocDetail')));
          oViewModel.setProperty(
            '/fieldControl/display',
            _.reduce(mDetailData.AppraisalScreenSet.results, (acc, cur) => ({ ...acc, [cur.ColumnId]: cur.Zdipopt }), oViewModel.getProperty('/fieldControl/display'))
          );
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

      addGoalItem(sRootPath) {
        const oViewModel = this.getViewModel();
        const aItems = oViewModel.getProperty(`/goals/${sRootPath}`);
        const iItemsLength = aItems.length;
        let iCurrentItemsLength = oViewModel.getProperty('/currentItemsLength') ?? 0;

        if (iCurrentItemsLength === 7) {
          MessageBox.alert(this.getBundleText('MSG_10002')); // 더 이상 추가 할 수 없습니다.
          return;
        }

        oViewModel.setProperty('/currentItemsLength', ++iCurrentItemsLength);
        oViewModel.setProperty(`/goals/${sRootPath}`, [
          ...aItems,
          {
            rootPath: sRootPath,
            expanded: true,
            OrderNo: String(iItemsLength),
            ItemNo: String(iItemsLength + 1),
            ..._.reduce(this.GOAL_PROPERTIES, (acc, cur) => ({ ...acc, [cur]: _.includes(this.COMBO_PROPERTIES, cur) ? 'ALL' : _.noop() }), {}),
          },
        ]);
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

        this.addGoalItem(this.GOAL_TYPE.STRATEGY.name);
      },

      onPressAddDuty() {
        this.addGoalItem(this.GOAL_TYPE.DUTY.name);
      },

      onPressDeleteGoal(oEvent) {
        const oViewModel = this.getViewModel();
        const oSource = oEvent.getSource();

        // 삭제하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00049'), {
          onClose: (oAction) => {
            if (MessageBox.Action.OK === oAction) {
              const { root: sRootPath, itemKey: sDeleteTargetNum } = oSource.data();
              const aItems = oViewModel.getProperty(`/goals/${sRootPath}`);
              let iCurrentItemsLength = oViewModel.getProperty('/currentItemsLength') ?? 0;

              oViewModel.setProperty('/currentItemsLength', --iCurrentItemsLength);
              oViewModel.setProperty(
                `/goals/${sRootPath}`,
                _.chain(aItems)
                  .tap((array) => _.remove(array, { OrderNo: sDeleteTargetNum }))
                  .map((o, i) => ({ ...o, OrderNo: String(i), ItemNo: String(i + 1) }))
                  .value()
              );
            }
          },
        });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
