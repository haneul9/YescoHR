sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/AttachFileAction',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    Appno,
    AppUtils,
    AttachFileAction,
    FragmentEvent,
    TableUtils,
    TextUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.commuteConfirm.CommuteConfirm', {
      AttachFileAction: AttachFileAction,
      TableUtils: TableUtils,
      TextUtils: TextUtils,
      FragmentEvent: FragmentEvent,

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

          const oModel = this.getModel(ServiceNames.WORKTIME);

          const aOrgList = await Client.getEntitySet(oModel, 'MssOrgList', { Pernr: this.getAppointeeProperty('Pernr') });

          oViewModel.setProperty('/OrgList', aOrgList);

          // 나의 근무일정
          const [mMyCom] = await this.getMySchedule();

          oViewModel.setProperty('/MyCom', mMyCom);

          const dDate = mMyCom.Zyymm;

          oViewModel.setProperty('/search', {
            date: moment(dDate).format('yyyyMM'),
            dept: aOrgList[0].Orgeh,
          });

          const aTableList = await this.getWorkScheduleList();
          const oTable = this.byId('commuteTable');

          oViewModel.setProperty('/listInfo', {
            ...TableUtils.count({ oTable, aRowData: aTableList }),
            ObjTxt1: this.getBundleText('LABEL_00197'), // 미신청
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
          _.every(aSelectRows, (e) => {
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
              AppUtils.setAppBusy(true, this);

              const oModel = this.getModel(ServiceNames.WORKTIME);
              const oViewModel = this.getViewModel();

              await Promise.all([
                _.forEach(aSelectRows, async (e) => {
                  if (!e.Appno || _.parseInt(e.Appno) === 0) {
                    const sAppno = await Appno.get.call(this);

                    e.Appno = sAppno;
                    e.Appda = new Date();
                  }

                  return Client.create(oModel, 'WorkScheduleConfirm', { ...e, Prcty: 'C' });
                }),
              ]);

              // {확정}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00116'), {
                onClose: async () => {
                  const aTableList = await this.getWorkScheduleList();
                  const oTable = this.byId('commuteTable');
                  const mMyCom = oViewModel.getProperty('/MyCom');

                  oViewModel.setProperty('/listInfo', {
                    ...TableUtils.count({ oTable, aRowData: aTableList }),
                    ObjTxt1: this.getBundleText('LABEL_00197'), // 미신청
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
              AppUtils.setAppBusy(false, this);
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
          _.every(aSelectRows, (e) => {
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
              AppUtils.setAppBusy(true, this);

              const oModel = this.getModel(ServiceNames.WORKTIME);

              await Promise.all([
                _.forEach(aSelectRows, (e) => {
                  return Client.create(oModel, 'WorkScheduleConfirm', { ...e, Prcty: 'X' });
                }),
              ]);

              // {확정취소}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_10049'), {
                onClose: async () => {
                  const aTableList = await this.getWorkScheduleList();
                  const oTable = this.byId('commuteTable');
                  const mMyCom = oViewModel.getProperty('/MyCom');

                  oViewModel.setProperty('/listInfo', {
                    ...TableUtils.count({ oTable, aRowData: aTableList }),
                    ObjTxt1: this.getBundleText('LABEL_00197'), // 미신청
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
              AppUtils.setAppBusy(false, this);
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
            ...TableUtils.count({ oTable, aRowData: aTableList }),
            ObjTxt1: this.getBundleText('LABEL_00197'), // 미신청
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

        oViewModel.setProperty(
          '/SelectedRows',
          _.map(oEvent.getSource().getSelectedIndices(), (e) => {
            return oViewModel.getProperty(`/CommuteList/${e}`);
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
          Orgeh: mSearch.dept,
          Zyymm: mSearch.date,
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        return await Client.getEntitySet(oModel, 'WorkScheduleConfirm', mPayLoad);
      },

      onPressExcelDownload() {
        const oTable = this.byId('commuteTable');
        const aTableData = this.getViewModel().getProperty('/CommuteList');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_30006'); // 시차출퇴근 확정

        TableUtils.export({ oTable, aTableData, sFileName });
      },
    });
  }
);
