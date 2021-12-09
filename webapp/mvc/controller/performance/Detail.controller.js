sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
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
    ODataReadError,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.Detail', {
      onBeforeShow() {
        const oViewModel = new JSONModel({
          busy: false,
          year: 2021,
          tab: { selectedKey: 'T01' },
          stage: {
            headers: [
              { width: '15%', label: '준비중', icon: 'sap-icon://accelerated', completed: 'blue' }, //
              { width: '21%', label: '목표수립', icon: 'sap-icon://accelerated', completed: 'blue' },
              { width: '21%', label: '중간점검', icon: 'sap-icon://accelerated', completed: 'none' },
              { width: '21%', label: '성과평가', icon: 'sap-icon://accelerated', completed: 'none' },
              { width: '20%', label: '평가완료', icon: 'sap-icon://accelerated', completed: 'none' },
            ],
            rows: {
              10: [
                { label: '목표수립필요', completed: 'blue' }, //
                { label: '평가자합의중', completed: 'none' },
                { label: '목표수립완료', completed: 'none' },
              ],
              20: [
                { label: '중간점검필요', completed: 'none' }, //
                { label: '평가자점검중', completed: 'none' },
                { label: '중간점검완료', completed: 'none' },
              ],
              30: [
                { label: '자기평가필요', completed: 'none' }, //
                { label: '직무순환설문중', completed: 'none' },
                { label: '1차평가중', completed: 'none' },
                { label: '2차평가중', completed: 'none' },
                { label: '전사 Session 중', completed: 'none' },
              ],
              40: [
                { label: '평가결과확인필요', completed: 'none' }, //
                { label: '이의신청중', completed: 'none' },
                { label: '평가완료', completed: 'none' },
              ],
            },
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
      },

      async onObjectMatched() {
        // const oModel = this.getModel(ServiceNames.APPRAISAL);
        // const oViewModel = this.getViewModel();
        // try {
        //   oViewModel.setProperty('/busy', true);
        //   const aTableData = await this.readAppraisalPeeList({ oModel });
        //   this.setTableData({ oViewModel, aTableData });
        // } catch (oError) {
        //   this.debug('Controller > Performance List > onObjectMatched Error', oError);
        //   AppUtils.handleError(oError);
        // } finally {
        //   oViewModel.setProperty('/busy', false);
        // }
      },

      getCurrentLocationText(oArguments) {
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
      /**
       * @param  {JSONModel} oModel
       */
      readAppraisalPeeList({ oModel }) {
        const mAppointee = this.getAppointeeData();
        const sUrl = '/AppraisalPeeListSet';

        return new Promise((resolve, reject) => {
          oModel.read(sUrl, {
            filters: [
              new Filter('Werks', FilterOperator.EQ, mAppointee.Werks), //
              new Filter('Zzappee', FilterOperator.EQ, mAppointee.Pernr),
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
    });
  }
);