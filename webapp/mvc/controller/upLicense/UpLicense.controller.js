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
          rows: [],
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
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);
          let sName = ''; // Odata Name
          let sTableName = ''; // Table Name
          let sListName = ''; // PropertyList Name
          let sTableTitle = ''; // TableHeader Title Name
          let sTableMSG = ''; // TableHeader MSG
          let mPayLoad = {}; // Odata Paramaters

          switch (sSelectKey) {
            case 'A':
              // 행 클릭 시 해당 등록면허/면허상세의 등록 및 등록가능 내역이 팝업으로 조회됩니다.
              sTableMSG = this.getBundleText('MSG_39001');
              sTableTitle = this.getBundleText('LABEL_39005'); // 등록면허 보유현황
              sName = 'LicenseBoard';
              sTableName = this.sRegistTable;
              sListName = '/registList';
              mPayLoad = {
                Menid: this.getCurrentMenuId(),
              };
              break;
            case 'B':
              // 숫자 클릭 시 상세내역이 팝업으로 조회됩니다.
              sTableMSG = this.getBundleText('MSG_39002');
              sTableTitle = this.getBundleText('LABEL_39003'); // 부서별 면허보유현황
              sName = 'OrgLicenseBoard';
              sTableName = this.sDeptTable;
              sListName = '/rows';
              mPayLoad = {
                Menid: this.getCurrentMenuId(),
              };
              break;
            case 'C':
              // 숫자 클릭 시 상세내역이 팝업으로 조회됩니다.
              sTableMSG = this.getBundleText('MSG_39002');
              sTableTitle = this.getBundleText('LABEL_39004'); // 개인별 면허보유현황
              sName = 'PersLicenseList';
              sTableName = this.sIndividualTable;
              sListName = '/rows';
              mPayLoad = {
                Prcty: '3',
                Menid: this.getCurrentMenuId(),
              };
              break;
            default:
              return;
          }

          const mInfo = {
            infoMessage: sTableMSG,
            Title: sTableTitle,
            visibleStatus: 'X',
          };

          oViewModel.setProperty('/listInfo', mInfo);

          const oModel = this.getModel(ServiceNames.PA);
          const aTableList = await Client.getEntitySet(oModel, sName, mPayLoad);
          const oTable = this.byId(sTableName);

          if (sSelectKey !== 'A') {
            this.createDynTable(oTable, sListName, aTableList);
          } else {
            oViewModel.setProperty('/listInfo', {
              ...this.TableUtils.count({ oTable, aRowData: aTableList }),
              ...mInfo,
            });
            oViewModel.setProperty(sListName, aTableList);
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // dynamic Table
      createDynTable(oTable, sListName, aTableList = []) {
        const oModel = new sap.ui.model.json.JSONModel();
        const aColumnData = [
          { colId: 'Dept', colName: this.getBundleText('LABEL_00224'), colVisibility: true, colPosition: 0 }, // 부서
          { colId: 'Cnt', colName: this.getBundleText('LABEL_39014'), colVisibility: true, colPosition: 1 }, // 인원수
          ..._.times(_.size(aTableList), (i) => {
            return { colId: aTableList[i].Certty + aTableList[i].Certdt, colName: aTableList[i].Certtytx, colVisibility: true, colPosition: i + 2 };
          }),
        ];

        _.map(_.groupBy(aTableList, 'Orgeh'), (e) => {
          let i1 = 0;
          _.map(e, (e1) => {
            const i = _.parseInt(e1.Discntg || 0);

            i1 = i1 + i;
          });
          return i1;
        });

        oModel.setData({
          rows: aTableList,
          columns: aColumnData,
        });
        debugger;

        oTable.setModel(oModel);
        oTable.bindColumns('/columns', (sId, oContext) => {
          const sColumnName = oContext.getObject().colName;
          const sColumnId = oContext.getObject().colId;

          return new sap.ui.table.Column({
            label: sColumnName,
            template: sColumnId,
          });
        });
        oTable.bindRows(sListName);
      },
    });
  }
);
