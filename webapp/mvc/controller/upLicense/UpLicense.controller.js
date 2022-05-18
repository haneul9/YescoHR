sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    Fragment,
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
          registList: [
            {
              list: [],
              rowCount: 1,
            },
          ],
          indiList: [
            {
              list: [],
              rowCount: 1,
            },
          ],
          rows: [],
          rowCount: 1,
          dialogList: [],
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

      onBeforeShow() {
        this.TableUtils.summaryColspan({ oTable: this.byId(this.sRegistTable), aHideIndex: [1] });
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

      async onRegistSelectRow(oEvent) {
        const mRowData = oEvent.getParameter('rowBindingContext').getObject();
        const mPayLoad = {
          Certty: mRowData.Certty,
          Certdt: mRowData.Certdt,
          Prcty: '1',
          Menid: this.getCurrentMenuId(),
        };

        this.openDialog(mPayLoad);
      },

      async onDeptSelectRow(sColumnId, oEvent) {
        const mRowData = oEvent.getSource().getBindingContext().getProperty();
        const sCertty = sColumnId.slice(4, 8);
        const sCertdt = sColumnId.slice(8, 12);
        const mPayLoad = {
          Certty: sCertty,
          Certdt: sCertdt,
          Orgeh: mRowData.Orgeh,
          Prcty: '2',
          Menid: this.getCurrentMenuId(),
        };

        this.openDialog(mPayLoad);
      },

      // Open Dialog
      async openDialog(mPayLoad = {}) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.PA);
          const aDetail = await Client.getEntitySet(oModel, 'PersLicenseList', mPayLoad);

          setTimeout(() => {
            if (!this._pDetailDialog) {
              const oView = this.getView();

              this._pDetailDialog = Fragment.load({
                id: oView.getId(),
                name: 'sap.ui.yesco.mvc.view.upLicense.fragment.DetailDialog',
                controller: this,
              }).then(function (oDialog) {
                oView.addDependent(oDialog);
                return oDialog;
              });
            }

            this._pDetailDialog.then(function (oDialog) {
              oViewModel.setProperty('/dialogList', aDetail);
              oViewModel.setProperty('/dialogListCount', _.size(aDetail));
              oDialog.open();
            });
          }, 100);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // Dialog Close
      onDialogClose(oEvent) {
        oEvent.getSource().getParent().close();
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
              sTableTitle = this.getBundleText('LABEL_39004'); // 개인별 면허보유현황
              sName = 'PersLicenseList';
              sTableName = this.sIndividualTable;
              sListName = '/indiList';
              mPayLoad = {
                Prcty: '3',
                Menid: this.getCurrentMenuId(),
              };
              break;
            default:
              return;
          }

          const oModel = this.getModel(ServiceNames.PA);
          const aTableList = await Client.getEntitySet(oModel, sName, mPayLoad);
          const oTable = this.byId(sTableName);
          const mInfo = {
            infoMessage: sTableMSG,
            Title: sTableTitle,
            visibleStatus: 'X',
          };

          if (sSelectKey === 'B') {
            this.createDynTable(oTable, sListName, mInfo, aTableList);
          } else {
            oViewModel.setProperty('/listInfo', { ...mInfo, ..._.pick(this.TableUtils.count({ oTable, aRowData: aTableList }), 'totalCount') });
            oViewModel.setProperty(sListName, {
              list: aTableList,
              ..._.pick(this.TableUtils.count({ oTable, aRowData: aTableList }), 'rowCount'),
            });
          }
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // dynamic Table
      createDynTable(oTable, sListName, mInfo, aTableList = []) {
        const oViewModel = this.getViewModel();
        const aColumnData = [
          { colId: 'Orgtx', colName: this.getBundleText('LABEL_00224'), width: '15%' }, // 부서
          { colId: 'Empcnt', colName: this.getBundleText('LABEL_39014'), width: '5%' }, // 인원수
          ..._.times(_.size(aTableList), (i) => {
            return { colId: `Cert${aTableList[i].Certty}${aTableList[i].Certdt}`, colName: aTableList[i].Discert, width: 'auto' };
          }),
          // { colId: 'Sumcnt', colName: this.getBundleText('LABEL_00172'), width: 'auto' }, // 합계
        ];
        const aGroupby = _.groupBy(aTableList, 'Orgeh');
        const aRows = [
          ..._.map(aGroupby, (e) => {
            const [mBody] = _.map(
              _.map(aGroupby, (e) => {
                return _.map(e, (e1) => {
                  return [...[`Cert${e1.Certty}${e1.Certdt}`, e1.Discntg]];
                });
              }),
              (v) => {
                return _.fromPairs(v); // 배열을 Obj변환
              }
            );
            const iSum = _.reduce(
              mBody,
              (total, num) => {
                return total + num;
              },
              0
            );
            return { ...mBody, Orgeh: e[0].Orgeh, Orgtx: e[0].Orgtx, Empcnt: e[0].Empcnt, Sumcnt: iSum };
          }),
        ];
        // const mSumRow = {
        //   ...this.TableUtils.generateSumRow({
        //     aTableData: aBodyRows,
        //     mSumField: { Orgtx: this.getBundleText('LABEL_00172') },
        //     vCalcProps: /^Cert/,
        //   }),
        //   ..._.pick(
        //     this.TableUtils.generateSumRow({
        //       aTableData: aBodyRows,
        //       mSumField: { Orgtx: this.getBundleText('LABEL_00172') },
        //       vCalcProps: ['Sumcnt', 'Empcnt'],
        //     }),
        //     ['Sumcnt', 'Empcnt']
        //   ),
        // };

        oViewModel.setData(
          {
            rows: aRows,
            columns: aColumnData,
          },
          true
        );
        oTable.setModel(oViewModel);
        oTable.bindColumns('/columns', (sId, oContext) => {
          const mConObj = oContext.getObject();
          const sColumnName = mConObj.colName;
          const sColumnId = mConObj.colId;
          const sWidth = mConObj.width;

          return new sap.ui.table.Column({
            label: new sap.m.Label({
              text: sColumnName,
            }),
            template: new sap.m.HBox({
              items: [
                new sap.m.Text({
                  layoutData: new sap.m.FlexItemData({ growFactor: 1 }),
                  text: `{${sColumnId}}`,
                  width: '100%',
                  textAlign: 'Center',
                  visible: sColumnId === 'Orgtx' || sColumnId === 'Empcnt' || sColumnId === 'Sumcnt',
                }),
                new sap.m.Link({
                  layoutData: new sap.m.FlexItemData({ growFactor: 1 }),
                  width: '100%',
                  textAlign: 'Center',
                  text: `{${sColumnId}}`,
                  press: this.onDeptSelectRow.bind(this, sColumnId),
                  visible: sColumnId !== 'Orgtx' && sColumnId !== 'Empcnt' && sColumnId !== 'Sumcnt',
                }),
              ],
            }),
            width: sWidth,
          });
        });
        oTable.bindRows(sListName);
        oViewModel.setProperty('/rowCount', _.pick(this.TableUtils.count({ oTable, aRowData: aRows }), 'rowCount'));
        oViewModel.setProperty('/listInfo', { ...mInfo, ..._.pick(this.TableUtils.count({ oTable, aRowData: aRows }), 'totalCount') });
      },
    });
  }
);
