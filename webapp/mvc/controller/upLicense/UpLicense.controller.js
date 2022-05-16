sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    Fragment,
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.upLicense.UpLicense', {
      sRegistTable: 'registTable',
      sDeptTable: 'deptTable',
      sIndividualTable: 'indiTable',

      initializeModel() {
        return {
          busy: false,
          selectedKey: 'A',
          registList: [],
          columnData: [
            { colId: 'Amt', colName: 'Amount', colVisibility: true, colPosition: 0 },
            { colId: 'Qty', colName: 'Quantity', colVisibility: true, colPosition: 1 },
            { colId: 'Unt', colName: 'Unit', colVisibility: true, colPosition: 2 },
            { colId: 'OPA', colName: 'OpenPOAmount', colVisibility: true, colPosition: 3 },
            { colId: 'OPQ', colName: 'OpenPOQuantity', colVisibility: true, colPosition: 4 },
          ],
          deptList: [
            {
              Amount: '200',
              Quantity: 'RF',
              Unit: 'CV',
              OpenPOAmount: '5988',
              OpenPOQuantity: 'YY',
              EXT_FLDS: {
                PRINTING_NUM: {
                  fieldvalue: 10,
                  fieldlabel: 'Printing Number',
                  uictrl: 'sap.m.Input',
                },
                COUNTRY: {
                  fieldvalue: 'Thailand',
                  fieldlabel: 'Country',
                  uictrl: 'sap.m.ComboBox',
                },
              },
            },
            {
              Amount: '80',
              Quantity: 'UG',
              Unit: 'RT',
              OpenPOAmount: '878',
              OpenPOQuantity: 'RF',
              EXT_FLDS: {
                PRINTING_NUM: {
                  fieldvalue: 11,
                  fieldlabel: 'Printing Number',
                  uictrl: 'sap.m.Input',
                },
                COUNTRY: {
                  fieldvalue: 'Thailand',
                  fieldlabel: 'Country',
                  uictrl: 'sap.m.ComboBox',
                },
              },
            },
            {
              Amount: '789',
              Quantity: 'GV',
              Unit: 'ED',
              OpenPOAmount: '8989',
              OpenPOQuantity: 'FGG',
              EXT_FLDS: {
                PRINTING_NUM: {
                  fieldvalue: 12,
                  fieldlabel: 'Printing Number',
                  uictrl: 'sap.m.Input',
                },
                COUNTRY: {
                  fieldvalue: 'Thailand',
                  fieldlabel: 'Country',
                  uictrl: 'sap.m.ComboBox',
                },
              },
            },
          ],
          indiList: [],
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
        };
      },

      onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());

        try {
          this.oDataCallTable('A');
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // TabBar 선택
      onSelectTabBar() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);
          this.oDataCallTable(oViewModel.getProperty('/selectedKey'));
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // Tab에 맞는 Odata호출
      async oDataCallTable(sSelectKey = '') {
        let sName = ''; // Odata Name
        let sTableName = ''; // Table Name
        let sListName = ''; // PropertyList Name
        let sTableTitle = ''; // TableHeader Title Name
        let sTableMSG = ''; // TableHeader MSG
        let mPayLoad = ''; // Odata Paramaters

        switch (sSelectKey) {
          case 'A':
            // 행 클릭 시 해당 등록면허/면허상세의 등록 및 등록가능 내역이 팝업으로 조회됩니다.
            sTableMSG = this.getBundleText('MSG_39001');
            sTableTitle = this.getBundleText('LABEL_39005'); // 등록면허 보유현황
            sName = 'LicenseBoard';
            sTableName = this.sRegistTable;
            sListName = '/registList';
            mPayLoad = {};
            break;
          case 'B':
            // 숫자 클릭 시 상세내역이 팝업으로 조회됩니다.
            sTableMSG = this.getBundleText('MSG_39002');
            sTableTitle = this.getBundleText('LABEL_39003'); // 부서별 면허보유현황
            sName = 'PersLicenseList';
            sTableName = this.sDeptTable;
            sListName = '/byList';
            mPayLoad = {};
            break;
          case 'C':
            // 숫자 클릭 시 상세내역이 팝업으로 조회됩니다.
            sTableMSG = this.getBundleText('MSG_39002');
            sTableTitle = this.getBundleText('LABEL_39004'); // 개인별 면허보유현황
            sName = 'OrgLicenseBoard';
            sTableName = this.sIndividualTable;
            sListName = '/byList';
            mPayLoad = {};
            break;
          default:
            return;
        }

        const oViewModel = this.getViewModel();
        const mInfo = {
          infoMessage: sTableMSG,
          Title: sTableTitle,
          visibleStatus: 'X',
        };

        oViewModel.setProperty('/listInfo', mInfo);

        const oModel = this.getModel(ServiceNames.WORKTIME);
        const aTableList = await Client.getEntitySet(oModel, sName, mPayLoad);
        const oTable = this.byId(sTableName);

        oViewModel.setProperty('/listInfo', {
          ...this.TableUtils.count({ oTable, aRowData: aTableList }),
          ...mInfo,
        });
        oViewModel.setProperty(sListName, aTableList);
      },

      // dynamic Table
      createDynTable() {},
    });
  }
);
