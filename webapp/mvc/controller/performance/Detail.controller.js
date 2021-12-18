sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date', // DatePicker 에러 방지 import : Loading of data failed: Error: Date must be a JavaScript date object
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    Filter,
    FilterOperator,
    JSONModel,
    MessageBox,
    AppUtils,
    UI5Error,
    ODataReadError,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.Detail', {
      LIST_PAGE_ID: 'container-ehr---performance',
      SUMMARY_PROPERTIES: ['Zmepoint', 'Zmapoint', 'Zmbgrade'],
      MANAGE_PROPERTIES: ['Z131', 'Z132', 'Z136', 'Z137', 'Z140', 'Papp1', 'Papp2'],
      GOAL_PROPERTIES: ['Obj0', 'Fwgt', 'Z101', 'Z103', 'Z109', 'Z111', 'Zapgme', 'Zapgma', 'Ztbegda', 'Ztendda', 'Zmarslt', 'Zrslt', 'Z1175', 'Z1174', 'Z1173', 'Z1172', 'Z1171', 'Z125Ee', 'Z125Er'],

      initializeFieldsControl(acc, cur) {
        return { ...acc, [cur]: 'X' };
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
            display: _.assignIn(_.reduce(this.GOAL_PROPERTIES, this.initializeFieldsControl, {}), _.reduce(this.SUMMARY_PROPERTIES, this.initializeFieldsControl, {}), _.reduce(this.MANAGE_PROPERTIES, this.initializeFieldsControl, {})),
            limit: _.assignIn(this.getEntityLimit(ServiceNames.APPRAISAL, 'AppraisalDoc'), this.getEntityLimit(ServiceNames.APPRAISAL, 'AppraisalDocDetail')),
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

          const mParameter = oListView.getModel().getProperty('/parameter/rowData');

          oViewModel.setProperty('/busy', true);
          oViewModel.setProperty('/year', oParameter.year);
          oViewModel.setProperty('/param', { ..._.omit(mParameter, '__metadata') });

          const [aStepList, aTopGoals, aStatus, aGrades, mDetailData] = await Promise.all([
            this.readAppStatusStepList({ oModel, sPid: mParameter.Zzappid }), //
            this.readRelaUpTarget({ oModel, sAppee: mParameter.Zzappee }),
            this.readAppValueList({ oModel }),
            this.readAppGradeList({ oModel }),
            this.readDeepAppraisalDoc({ oModel, mKeys: oViewModel.getProperty('/param') }),
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
              if (mParameter.ZzapstsSub === 'X') {
                bCompleted = true;
              } else if (o.ApStatus === mParameter.Zzapsts) {
                bCompleted = false;
              }
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

          oViewModel.setProperty('/entry/levels', aGrades ?? []);
          oViewModel.setProperty('/entry/topGoals', aTopGoals ?? []);
          oViewModel.setProperty('/entry/status', aStatus ?? []);
          oViewModel.setProperty('/summary', { ..._.pick(mDetailData, this.SUMMARY_PROPERTIES) });
          oViewModel.setProperty('/manage', { ..._.pick(mDetailData, this.MANAGE_PROPERTIES) });
          oViewModel.setProperty('/buttons', mDetailData.AppraisalBottnsSet.results ?? []);
          oViewModel.setProperty('/currentItemsLength', _.toLength(mDetailData.AppraisalDocDetailSet.results));
          oViewModel.setProperty('/goals/strategy', _.map(mGroupDetailByZ101['1'], (o, i) => ({ rootPath: 'strategy', expanded: false, OrderNo: String(i), ItemNo: String(i + 1), ...o })) ?? []);
          oViewModel.setProperty('/goals/duty', _.map(mGroupDetailByZ101['2'], (o, i) => ({ rootPath: 'duty', expanded: false, OrderNo: String(i), ItemNo: String(i + 1), ...o })) ?? []);
          oViewModel.setProperty('/stage/headers', aStageHeader);
          oViewModel.setProperty(
            '/stage/rows',
            _.chain(mGroupStageByApStatusSub[''])
              .map((o, i) => ({ child: aGroupStageByApStatusName[i] }))
              .value()
          );
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
          onAfterRendering: () => {
            const aHeaders = this.getViewModel().getProperty('/stage/headers');

            oStageHeader.getItems().forEach((o, i) => o.toggleStyleClass('on', aHeaders[i].completed ?? false));
          },
        });

        const oStageBody = this.byId('stageBody');
        oStageBody.addEventDelegate({
          onAfterRendering: () => {
            const aRows = this.getViewModel().getProperty('/stage/rows');

            oStageBody.getItems().forEach((row, rowidx) => {
              row.getItems().forEach((o, childidx) => o.toggleStyleClass('on', _.get(aRows, [rowidx, 'child', childidx, 'completed']) ?? false));
            });
          },
        });
      },

      addGoalItem({ sRootPath }) {
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
            ..._.reduce(this.GOAL_PROPERTIES, (acc, cur) => ({ ...acc, [cur]: null }), {}),
          },
        ]);
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onPressAddStrategy() {
        const oViewModel = this.getViewModel();
        const sRootPath = 'strategy';

        if (_.isEmpty(oViewModel.getProperty('/entry/topGoals'))) {
          MessageBox.alert(this.getBundleText('MSG_10003')); // 연관 상위 목표가 존재하지 않는 경우 전략목표를 생성할 수 없습니다.
          return;
        }

        this.addGoalItem({ sRootPath });
      },

      onPressAddDuty() {
        const sRootPath = 'duty';

        this.addGoalItem({ sRootPath });
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
      readDeepAppraisalDoc({ oModel, mKeys }) {
        return new Promise((resolve, reject) => {
          const sUrl = '/AppraisalDocSet';

          oModel.create(
            sUrl,
            {
              ...mKeys,
              Menid: this.getCurrentMenuId(),
              Prcty: 'D',
              Zzappgb: 'ME',
              AppraisalDocDetailSet: [],
              AppraisalBottnsSet: [],
              AppraisalScreenSet: [],
            },
            {
              success: (oData) => {
                this.debug(`${sUrl} success.`, oData);

                resolve(oData ?? {});
              },
              error: (oError) => {
                this.debug(`${sUrl} error.`, oError);

                reject(new ODataReadError(oError));
              },
            }
          );
        });
      },

      readAppStatusStepList({ oModel, sPid }) {
        const sUrl = '/AppStatusStepListSet';

        return new Promise((resolve, reject) => {
          oModel.read(sUrl, {
            filters: [
              new Filter('Zzappid', FilterOperator.EQ, sPid), //
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      readRelaUpTarget({ oModel, sAppee }) {
        const sUrl = '/RelaUpTargetSet';

        return new Promise((resolve, reject) => {
          oModel.read(sUrl, {
            filters: [
              new Filter('Zzappee', FilterOperator.EQ, sAppee), //
            ],
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      readAppValueList({ oModel }) {
        const sUrl = '/AppValueListSet';

        return new Promise((resolve, reject) => {
          oModel.read(sUrl, {
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      readAppGradeList({ oModel }) {
        const sUrl = '/AppGradeListSet';

        return new Promise((resolve, reject) => {
          oModel.read(sUrl, {
            success: (oData) => {
              this.debug(`${sUrl} success.`, oData);

              resolve(oData.results ?? []);
            },
            error: (oError) => {
              this.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },
    });
  }
);
