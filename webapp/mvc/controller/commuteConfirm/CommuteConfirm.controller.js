sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.commuteConfirm.CommuteConfirm', {
      initializeModel() {
        return {
          busy: false,
          OrgList: [],
          SelectedRows: [],
          MyCom: {},
          search: {},
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

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const mAppointee = this.getAppointeeData();
          let aOrgList = [];
          let oModel = {};
          let mPayLoad = {
            Pernr: mAppointee.Pernr,
          };

          if (this.isHass()) {
            oModel = this.getModel(ServiceNames.COMMON);

            aOrgList = await Client.getEntitySet(oModel, 'DashboardOrgList', _.set(mPayLoad, 'Werks', mAppointee.Werks));
          } else {
            oModel = this.getModel(ServiceNames.WORKTIME);

            aOrgList = await Client.getEntitySet(oModel, 'MssOrgList', mPayLoad);
          }

          oViewModel.setProperty('/OrgList', aOrgList);

          // 나의 근무일정
          const [mMyCom] = await this.getMySchedule();

          oViewModel.setProperty('/MyCom', mMyCom);

          const dDate = mMyCom.Zyymm;

          oViewModel.setProperty('/search', {
            date: moment(dDate).format('yyyyMM'),
            dept: this.getSessionProperty('Orgeh'),
          });

          const aTableList = await this.getWorkScheduleList();
          const oTable = this.byId('commuteTable');

          oViewModel.setProperty('/listInfo', {
            ...this.TableUtils.count({ oTable, aRowData: aTableList }),
            ObjTxt1: this.getBundleText('LABEL_00197'), // 미신청
            isShowApprove: false, // 승인 text hide
            ObjTxt4: this.getBundleText('LABEL_10049'), // 확정취소
            ObjTxt5: this.getBundleText('LABEL_00116'), // 확정
            // 신청기간 {0} ~ {1}
            infoMessage: `${this.getBundleText('LABEL_30007', moment(mMyCom.Begda).format('yyyy.MM.DD'), moment(mMyCom.Endda).format('yyyy.MM.DD'))}`,
          });
          oViewModel.setProperty('/CommuteList', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 확정
      onConfirm() {
        const oViewModel = this.getViewModel();
        const aSelectRows = oViewModel.getProperty('/SelectedRows');

        if (_.isEmpty(aSelectRows)) {
          // 확정할 데이터를 선택하세요.
          MessageBox.alert(this.getBundleText('MSG_30005'));
          return;
        } else if (
          _.some(aSelectRows, (e) => {
            return e.ZappStatAl === '60';
          })
        ) {
          // 확정 상태의 데이터는 재확정이 불가합니다.
          MessageBox.alert(this.getBundleText('MSG_30006'));
          return;
        }

        // {확정}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00116'), {
          // 확정, 취소
          actions: [this.getBundleText('LABEL_00116'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 확정
            if (!vPress || vPress !== this.getBundleText('LABEL_00116')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true);

              const oModel = this.getModel(ServiceNames.WORKTIME);
              const oCommModel = this.getModel(ServiceNames.COMMON);
              const oViewModel = this.getViewModel();

              for (const row of aSelectRows) {
                if (!row.Appno || _.parseInt(row.Appno) === 0) {
                  const [mResult] = await Client.getEntitySet(oCommModel, 'CreateAppno');

                  _.chain(row).set('Appno', mResult.Appno).set('Appda', moment().hours(9).toDate()).commit();
                }
              }

              await Promise.all(_.map(aSelectRows, async (o) => Client.create(oModel, 'WorkScheduleConfirm', { ...o, Prcty: 'C' })));

              // {확정}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00116'), {
                onClose: async () => {
                  const aTableList = await this.getWorkScheduleList();
                  const oTable = this.byId('commuteTable');
                  const mMyCom = oViewModel.getProperty('/MyCom');

                  oViewModel.setProperty('/listInfo', {
                    ...this.TableUtils.count({ oTable, aRowData: aTableList }),
                    ObjTxt1: this.getBundleText('LABEL_00197'), // 미신청
                    isShowApprove: false, // 승인 text hide
                    ObjTxt4: this.getBundleText('LABEL_10049'), // 확정취소
                    ObjTxt5: this.getBundleText('LABEL_00116'), // 확정
                    // 신청기간 {0} ~ {1}
                    infoMessage: `${this.getBundleText('LABEL_30007', moment(mMyCom.Begda).format('yyyy.MM.DD'), moment(mMyCom.Endda).format('yyyy.MM.DD'))}`,
                  });
                  oViewModel.setProperty('/CommuteList', aTableList);
                  oTable.clearSelection();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // 확정취소
      onUnConfirm() {
        const oViewModel = this.getViewModel();
        const aSelectRows = oViewModel.getProperty('/SelectedRows');

        if (_.isEmpty(aSelectRows)) {
          // 확정취소할 데이터를 선택하세요.
          MessageBox.alert(this.getBundleText('MSG_30007'));
          return;
        } else if (
          _.some(aSelectRows, (e) => {
            return e.ZappStatAl !== '60';
          })
        ) {
          // 확정 상태의 데이터만 확정취소가 가능합니다.
          MessageBox.alert(this.getBundleText('MSG_30008'));
          return;
        }

        // {확정취소}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_10049'), {
          // 확정취소, 취소
          actions: [this.getBundleText('LABEL_10049'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 확정취소
            if (!vPress || vPress !== this.getBundleText('LABEL_10049')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true);

              const oModel = this.getModel(ServiceNames.WORKTIME);

              await Promise.all(_.map(aSelectRows, (e) => Client.create(oModel, 'WorkScheduleConfirm', { ...e, Prcty: 'X' })));

              // {확정취소}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_10049'), {
                onClose: async () => {
                  const aTableList = await this.getWorkScheduleList();
                  const oTable = this.byId('commuteTable');
                  const mMyCom = oViewModel.getProperty('/MyCom');

                  oViewModel.setProperty('/listInfo', {
                    ...this.TableUtils.count({ oTable, aRowData: aTableList }),
                    ObjTxt1: this.getBundleText('LABEL_00197'), // 미신청
                    isShowApprove: false, // 승인 text hide
                    ObjTxt4: this.getBundleText('LABEL_10049'), // 확정취소
                    ObjTxt5: this.getBundleText('LABEL_00116'), // 확정
                    // 신청기간 {0} ~ {1}
                    infoMessage: `${this.getBundleText('LABEL_30007', moment(mMyCom.Begda).format('yyyy.MM.DD'), moment(mMyCom.Endda).format('yyyy.MM.DD'))}`,
                  });
                  oViewModel.setProperty('/CommuteList', aTableList);
                  oTable.clearSelection();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // 조회
      async onSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          // 신청기간
          const [mMyCom] = await this.getMySchedule({ Zyymm: oViewModel.getProperty('/search/date') });

          oViewModel.setProperty('/MyCom', mMyCom);

          const aTableList = await this.getWorkScheduleList();
          const oTable = this.byId('commuteTable');

          oViewModel.setProperty('/listInfo', {
            ...this.TableUtils.count({ oTable, aRowData: aTableList }),
            ObjTxt1: this.getBundleText('LABEL_00197'), // 미신청
            isShowApprove: false, // 승인 text hide
            ObjTxt4: this.getBundleText('LABEL_10049'), // 확정취소
            ObjTxt5: this.getBundleText('LABEL_00116'), // 확정
            // 신청기간 {0} ~ {1}
            infoMessage: `${this.getBundleText('LABEL_30007', moment(mMyCom.Begda).format('yyyy.MM.DD'), moment(mMyCom.Endda).format('yyyy.MM.DD'))}`,
          });
          oViewModel.setProperty('/CommuteList', aTableList);
          oTable.clearSelection();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // table 체크박스
      onRowSelection(oEvent) {
        const oViewModel = this.getViewModel();
        const oTable = oEvent.getSource();
        const aSelectedIndices = oTable.getSelectedIndices();
        const aMappedIndices = oTable.getBindingInfo('rows').binding.aIndices;

        oViewModel.setProperty(
          '/SelectedRows',
          _.map(aSelectedIndices, (e) => {
            return oViewModel.getProperty(`/CommuteList/${aMappedIndices[e]}`);
          })
        );
      },

      // 나의 근무일정
      async getMySchedule(mZyymm = {}) {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mMyWorkPayLoad = {
          Pernr: this.getAppointeeProperty('Pernr'),
          ...mZyymm,
        };

        return await Client.getEntitySet(oModel, 'MyWorkSchedule', mMyWorkPayLoad);
      },

      // 시차출퇴근신청
      async getWorkScheduleList() {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mSearch = oViewModel.getProperty('/search');
        const mPayLoad = {
          Prcty: 'L',
          Actty: this.isHass() ? 'H' : 'M',
          Orgeh: mSearch.dept,
          Zyymm: mSearch.date,
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        return await Client.getEntitySet(oModel, 'WorkScheduleConfirm', mPayLoad);
      },

      onPressExcelDownload() {
        const oTable = this.byId('commuteTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_30006'); // 시차출퇴근 확정

        this.TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
