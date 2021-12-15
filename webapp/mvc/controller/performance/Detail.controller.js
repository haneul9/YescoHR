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
      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          param: {
            Zdocid: '',
            Zzappid: '',
            Partid: '',
          },
          year: moment().format('YYYY'),
          tab: { selectedKey: 'T01' },
          stage: {
            headers: [
              { label: '준비중', icon: 'asset/image/icon_per_status_01.png', completed: true }, //
              { label: '목표수립', icon: 'sap-icon://accelerated', completed: true },
              { label: '중간점검', icon: 'sap-icon://accelerated', completed: false },
              { label: '성과평가', icon: 'sap-icon://accelerated', completed: false },
              { label: '평가완료', icon: 'sap-icon://accelerated', completed: false },
            ],
            rows: [
              { child: [] }, //
              {
                child: [
                  { label: '목표수립필요', completed: true }, //
                  { label: '평가자합의중', completed: false },
                  { label: '목표수립완료', completed: false },
                ],
              },
              {
                child: [
                  { label: '중간점검필요', completed: false }, //
                  { label: '평가자점검중', completed: false },
                  { label: '중간점검완료', completed: false },
                ],
              },
              {
                child: [
                  { label: '자기평가필요', completed: false }, //
                  { label: '직무순환설문중', completed: false },
                  { label: '1차평가중', completed: false },
                  { label: '2차평가중', completed: false },
                  { label: '전사 Session 중', completed: false },
                ],
              },
              {
                child: [
                  { label: '평가결과확인필요', completed: false }, //
                  { label: '이의신청중', completed: false },
                  { label: '평가완료', completed: false },
                ],
              },
            ],
          },
          entry: {
            levels: [
              { code: '10', value: '1' }, //
              { code: '20', value: '2' },
              { code: '30', value: '3' },
              { code: '40', value: '4' },
              { code: '50', value: '5' },
            ],
            topGoals: [
              { code: '10', value: '전사 퇴직율 관리' }, //
              { code: '20', value: '테스트' },
            ],
          },
          manage: { Todo1: 'Todo1', Todo2: 'Todo2', Todo3: 'Todo3', Todo4: 'Todo4', Todo5: 'Todo5', Todo6: 'Todo6', Todo7: 'Todo7' },
          summary: { Todo1: '100', Todo2: '100', Todo3: '100' },
          currentItemsLength: 2,
          fieldControl: {
            isTodo3Show: true,
            isTodo4Show: true,
          },
          strategy: [
            {
              rootPath: 'strategy',
              expanded: false,
              OrderNo: '0',
              ItemNo: '1',
              Todo1: 'Todo1',
              Todo2: 'Todo2',
              Todo3: '10',
              Todo4: '10',
              Todo5: '10',
              Todo6: new Date(),
              Todo7: new Date(),
              Todo8: 'Todo8',
              Todo9: '10',
              Todo10: 'Todo10',
              Todo11: 'Todo11',
              Todo12: 'Todo12',
              Todo13: 'Todo13',
              Todo14: 'Todo14',
              Todo15: 'Todo15',
              Todo16: 'Todo16',
              Todo17: 'Todo17',
              Todo18: 'Todo18',
            }, //
          ],
          duty: [
            {
              rootPath: 'duty',
              expanded: false,
              OrderNo: '0',
              ItemNo: '1',
              Todo1: 'Todo1',
              Todo2: 'Todo2',
              Todo3: '10',
              Todo4: '10',
              Todo5: '10',
              Todo6: new Date(),
              Todo7: new Date(),
              Todo8: 'Todo8',
              Todo9: '10',
              Todo10: 'Todo10',
              Todo11: 'Todo11',
              Todo12: 'Todo12',
              Todo13: 'Todo13',
              Todo14: 'Todo14',
              Todo15: 'Todo15',
              Todo16: 'Todo16',
              Todo17: 'Todo17',
              Todo18: 'Todo18',
            }, //
          ],
        });
        this.setViewModel(oViewModel);

        const oStageHeader = this.byId('stageHeader');
        oStageHeader.addEventDelegate({
          onAfterRendering() {
            const aHeaders = oViewModel.getProperty('/stage/headers');
            const aHeaderItems = oStageHeader.getItems();

            aHeaderItems.forEach((o, i) => {
              if (aHeaders[i].completed) o.addStyleClass('on');
            });
          },
        });

        const oStageBody = this.byId('stageBody');
        oStageBody.addEventDelegate({
          onAfterRendering() {
            const aRows = oViewModel.getProperty('/stage/rows');

            oStageBody.getItems().forEach((row, rowidx) => {
              row.getItems().forEach((o, childidx) => {
                if (aRows[rowidx].child[childidx].completed) o.addStyleClass('on');
              });
            });
          },
        });
      },

      async onObjectMatched(oParameter) {
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const oViewModel = this.getViewModel();

        try {
          if (!_.every(['pid', 'docid', 'partid'], _.partial(_.has, oParameter))) throw new UI5Error({ code: 'E', message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.

          oViewModel.setProperty('/busy', true);
          oViewModel.setProperty('/param', { Zdocid: oParameter.docid, Zzappid: oParameter.pid, Partid: oParameter.partid });

          const mDetailData = await this.readDeepAppraisalDoc({ oModel, mKeys: oViewModel.getProperty('/param') });

          console.log(mDetailData);
          // this.setTableData({ oViewModel, aTableData });
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
        console.log(oArguments);
        return '목표수립필요';
      },

      addGoalItem({ sRootPath }) {
        const oViewModel = this.getViewModel();
        const aItems = oViewModel.getProperty(`/${sRootPath}`);
        const iItemsLength = aItems.length;
        let iCurrentItemsLength = oViewModel.getProperty('/currentItemsLength') ?? 0;

        if (iCurrentItemsLength === 7) {
          MessageBox.alert('더 이상 추가 할 수 없습니다.');
          return;
        }

        oViewModel.setProperty('/currentItemsLength', ++iCurrentItemsLength);
        oViewModel.setProperty(`/${sRootPath}`, [
          ...aItems,
          {
            rootPath: sRootPath,
            expanded: true,
            OrderNo: String(iItemsLength),
            ItemNo: String(iItemsLength + 1),
            Todo1: 'Todo1',
            Todo2: 'Todo2',
            Todo3: '10',
            Todo4: '10',
            Todo5: '10',
            Todo6: new Date(),
            Todo7: new Date(),
            Todo8: 'Todo8',
            Todo9: '10',
            Todo10: 'Todo10',
            Todo11: 'Todo11',
            Todo12: 'Todo12',
            Todo13: 'Todo13',
            Todo14: 'Todo14',
            Todo15: 'Todo15',
            Todo16: 'Todo16',
            Todo17: 'Todo17',
            Todo18: 'Todo18',
          },
        ]);
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onPressAddStrategy() {
        const sRootPath = 'strategy';

        this.addGoalItem({ sRootPath });
      },

      onPressAddDuty() {
        const sRootPath = 'duty';

        this.addGoalItem({ sRootPath });
      },

      onPressDeleteGoal(oEvent) {
        const oViewModel = this.getViewModel();
        const oSource = oEvent.getSource();
        const sRootPath = oSource.getCustomData()[0].getValue();
        const sDeleteTargetNum = oSource.getCustomData()[1].getValue();
        const aItems = oViewModel.getProperty(`/${sRootPath}`);
        let iCurrentItemsLength = oViewModel.getProperty('/currentItemsLength') ?? 0;

        _.remove(aItems, { OrderNo: sDeleteTargetNum });

        oViewModel.setProperty('/currentItemsLength', --iCurrentItemsLength);
        oViewModel.setProperty(
          `/${sRootPath}`,
          _.map(aItems, (o, i) => {
            return { ...o, OrderNo: String(i), ItemNo: String(i + 1) };
          })
        );
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
              AppraisalDocDetailSet: [],
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
    });
  }
);
