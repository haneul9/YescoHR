/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    Appno,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.workTime.mobile.WorkTimeDetail', {
      initializeModel() {
        return {
          Fixed: true,
          DelBtn: false,
          FieldLimit: {},
          employees: [],
          DeletedRows: [],
          CauseType: [],
          detail: {
            listMode: 'MultiToggle', // None
            list: [],
            rowCount: 1,
          },
          dialog: {
            listMode: 'MultiToggle', // None
            list: [],
            rowCount: 1,
          },
          DialogData: {
            Datum: new Date(),
            Beguz: '18:00',
            Abrst: '',
            Ottyp: 'ALL',
          },
          busy: false,
        };
      },

      async onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);

        oViewModel.setData(this.initializeModel());

        try {
          // Input Field Imited
          oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.WORKTIME, 'OtWorkApply')));
          oViewModel.setProperty('/busy', true);

          const sMenid = this.getCurrentMenuId();
          const sPernr = this.getAppointeeProperty('Pernr');

          // 대상자리스트
          const aOtpList = await Client.getEntitySet(oModel, 'OtpernrList', {
            Menid: sMenid,
            Datum: new Date(),
            Pernr: sPernr,
          });

          oViewModel.setProperty(
            '/employees',
            aOtpList.map((o) => ({ ...o, Pernr: _.trimStart(o.Pernr, '0') }))
          );

          // 근무 사유
          const aCauseList = await Client.getEntitySet(oModel, 'WorktimeCodeList', {
            Datum: new Date(),
            Cdnum: 'TM0003',
            Grcod: 'TM000003',
          });

          oViewModel.setProperty('/CauseType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aCauseList }));

          if (sDataKey === 'N' || !sDataKey) {
            const mSessionData = this.getSessionData();

            oViewModel.setProperty('/ApplyInfo', {
              Apename: mSessionData.Ename,
              Aporgtx: `${mSessionData.Btrtx} / ${mSessionData.Orgtx}`,
              Apjikgbtl: `${mSessionData.Zzjikgbt} / ${mSessionData.Zzjikcht}`,
            });
          } else {
            oViewModel.setProperty('/busy', true);

            const oTargetData = await Client.getEntitySet(oModel, 'OtWorkApply', {
              Appno: sDataKey,
            });

            const iLength = oTargetData.length;

            oViewModel.setProperty('/detail', {
              listMode: 'None',
              list: oTargetData,
              rowCount: iLength < 5 ? iLength : 5,
            });

            oViewModel.setProperty('/Fixed', false);
            oViewModel.setProperty('/DelBtn', oTargetData[0].ZappStatAl === '20');
            oViewModel.setProperty('/ApplyInfo', oTargetData[0]);
            oViewModel.setProperty('/ApprovalDetails', oTargetData[0]);
          }

          this.onAddDetail();

          this.settingsAttachTable();
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 근무시간
      formatTime(sTime1 = '', sTime2 = '', sTime3) {
        sTime1 = !sTime1 ? '0' : `${sTime1.slice(-4, -2)}:${sTime1.slice(-2)}`;
        sTime2 = !sTime2 ? '0' : `${sTime2.slice(-4, -2)}:${sTime2.slice(-2)}`;

        return sTime1 + '~' + sTime2 + '(' + sTime3 + ')';
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR17';
      },

      getCurrentLocationText(oArguments) {
        const sAction = oArguments.oDataKey === 'N' ? this.getBundleText('LABEL_04002') : this.getBundleText('LABEL_00165');

        return sAction;
      },

      // 신청내역 추가
      onAddDetail() {
        setTimeout(() => {
          const oViewModel = this.getViewModel();
          const oEmpData = this.getAppointeeData();

          let aList = [];
          let iLength = 1;

          oViewModel.setProperty('/DialogData', {
            Datum: new Date(),
            Beguz: '18:00',
            Abrst: '',
            Ottyp: 'ALL',
          });

          aList.push({
            Pernr: oEmpData.Pernr,
            Ename: oEmpData.Ename,
            Zzjikgbt: oEmpData.Zzjikgbt,
            Zzjikcht: oEmpData.Zzjikcht,
            Orgtx: oEmpData.Orgtx,
          });

          iLength = 1;
          oViewModel.setProperty('/dialog/list', aList);
          oViewModel.setProperty('/dialog/rowCount', iLength < 5 ? iLength : 5);
        }, 100);
      },

      // 신청내역 삭제
      onDelDetail() {
        const oViewModel = this.getViewModel();

        const oList = this.byId('DetailList').getSelectedContexts();

        if (_.isEmpty(oList)) {
          // 삭제할 데이터를 선택하세요.
          MessageBox.alert(this.getBundleText('MSG_00055'));
          return;
        }

        const aDelList = _.map(oList, (e) => {
          return oViewModel.getProperty(e.sPath);
        });

        const aDiffList = _.difference(oViewModel.getProperty('/detail/list'), aDelList);
        const iLength = _.size(aDiffList);

        oViewModel.setProperty('/detail/list', aDiffList);
        oViewModel.setProperty('/detail/rowCount', iLength < 5 ? iLength : 5);
        this.byId('DetailList').removeSelections(true);
      },

      // Dialog 저장
      async onDialogSavBtn() {
        if (this.checkError()) {
          return;
        }

        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          await Promise.all(
            _.forEach(oViewModel.getProperty('/dialog/list'), async (e, i) => {
              const oOverTime = await this.overTime(e);

              oViewModel.setProperty(`/dialog/list/${i}/Notes`, oOverTime.Notes);
              this.dateMovement(i + 1);
            })
          ).then(() => {
            this.onAddDetail();
          });
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      dateMovement(index) {
        const oViewModel = this.getViewModel();
        const aDialogList = oViewModel.getProperty('/dialog/list');

        if (index !== _.size(aDialogList)) {
          return;
        }

        const mDialogData = {
          ...oViewModel.getProperty('/DialogData'),
          Ottyptx: _.chain(oViewModel.getProperty('/CauseType'))
            .find((e) => {
              return e.Zcode === oViewModel.getProperty('/DialogData/Ottyp');
            })
            .get('Ztext')
            .value(),
        };

        const aFilterList = [
          ...oViewModel.getProperty('/detail/list'),
          ..._.chain(aDialogList)
            .filter((e) => {
              return !!e.Pernr;
            })
            .each((e) => {
              e.Datum = mDialogData.Datum;
              e.Beguz = mDialogData.Beguz.replace(':', '');
              e.Enduz = mDialogData.Enduz.replace(':', '');
              e.Abrst = mDialogData.Abrst;
              e.Ottyp = mDialogData.Ottyp;
              e.Ottyptx = mDialogData.Ottyptx;
              e.Atrsn = mDialogData.Atrsn;
            })
            .value(),
        ];

        const iLength = _.size(aFilterList);

        oViewModel.setProperty('/detail/list', aFilterList);
        oViewModel.setProperty('/detail/rowCount', iLength < 5 ? iLength : 5);
      },

      // Dialog 근무시간
      async onTimePicker() {
        const oViewModel = this.getViewModel();
        const mDialogData = oViewModel.getProperty('/DialogData');

        if (!mDialogData.Enduz || !mDialogData.Beguz) {
          return;
        }

        try {
          oViewModel.setProperty('/busy', true);
          // 초과시간
          const oOverTime = await this.overTime();

          oViewModel.setProperty('/DialogData/Abrst', oOverTime.Abrst);
          oViewModel.setProperty('/DialogData/Notes', oOverTime.Notes);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // Dialog 근무일
      async onWorkDatePicker() {
        const oViewModel = this.getViewModel();

        if (!oViewModel.getProperty('/DialogData/Datum')) {
          return;
        }

        try {
          oViewModel.setProperty('/busy', true);
          // 초과시간
          const oOverTime = await this.overTime();

          oViewModel.setProperty('/DialogData/Abrst', oOverTime.Abrst);
          oViewModel.setProperty('/DialogData/Notes', oOverTime.Notes);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // Dialog 초과근무시간
      overTime(mData) {
        const oViewModel = this.getViewModel();
        const mDialogData = oViewModel.getProperty('/DialogData');

        if (!mDialogData.Beguz || !mDialogData.Enduz) {
          return;
        }

        let sPernr = this.getAppointeeProperty('Pernr');

        if (mData) {
          sPernr = mData.Pernr;
        }

        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mPayLoad = {
          Pernr: sPernr,
          Datum: mDialogData.Datum,
          Beguz: mDialogData.Beguz.replace(':', ''),
          Enduz: mDialogData.Enduz.replace(':', ''),
        };

        return Client.create(oModel, 'OtWorkApply', mPayLoad);
      },

      checkError() {
        const oViewModel = this.getViewModel();
        const mDialogData = oViewModel.getProperty('/DialogData');

        // 사유
        if (mDialogData.Ottyp === 'ALL' || !mDialogData.Ottyp) {
          MessageBox.alert(this.getBundleText('MSG_27004'));
          return true;
        }

        // 근무시간
        if (mDialogData.Abrst === '0' || !mDialogData.Abrst) {
          MessageBox.alert(this.getBundleText('MSG_27005'));
          return true;
        }

        const aList = oViewModel.getProperty('/dialog/list');
        const aDetailList = _.cloneDeep(oViewModel.getProperty('/detail/list'));
        const aFilter = _.filter(aList, (e) => {
          return !!e.Pernr;
        });
        // 동일사번/일자
        if (
          !!_.chain(aDetailList)
            .filter((e) => {
              return _.find(aList, (e1) => {
                return e.Pernr === _.trimStart(e1.Pernr, '0');
              });
            })
            .find((e) => {
              return (
                moment(e.Datum).format('YYYY.MM.DD') === moment(mDialogData.Datum).format('YYYY.MM.DD') &&
                e.Beguz === mDialogData.Beguz.replace(':', '') &&
                e.Enduz === mDialogData.Enduz.replace(':', '')
              );
            })
            .value() ||
          _.chain(aFilter)
            .map((e) => {
              return (e.Pernr = _.trimStart(e.Pernr, '0'));
            })
            .uniq()
            .size()
            .value() !== _.size(aFilter)
        ) {
          MessageBox.alert(this.getBundleText('MSG_27006'));
          return true;
        }

        return false;
      },

      // 신청
      onApplyBtn() {
        if (_.isEmpty(this.getViewModel().getProperty('/detail/list'))) {
          // 신청내역을 등록하세요.
          return MessageBox.alert(this.getBundleText('MSG_27007'));
        }

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          actions: [
            this.getBundleText('LABEL_00118'), // 취소
            this.getBundleText('LABEL_00121'), // 신청
          ],
          onClose: async (vPress) => {
            // 신청
            if (!vPress || vPress !== this.getBundleText('LABEL_00121')) {
              return;
            }

            try {
              AppUtils.setAppBusy(true);

              const oViewModel = this.getViewModel();
              const sAppno = await Appno.get.call(this);
              const oModel = this.getModel(ServiceNames.WORKTIME);
              const aDetailList = _.each(oViewModel.getProperty('/detail/list'), (e) => {
                e.Beguz = e.Beguz.replace(':', '');
                e.Enduz = e.Enduz.replace(':', '');
              });
              let oSendObject = {
                ...aDetailList[0],
                Appno: sAppno,
                Appda: new Date(),
                Menid: this.getCurrentMenuId(),
                Prcty: 'V',
                OtWorkNav: aDetailList,
              };

              const oCheck = await Client.deep(oModel, 'OtWorkApply', oSendObject);

              if (!!oCheck.Retmsg) {
                AppUtils.setAppBusy(false);
                oCheck.Retmsg = _.replace(oCheck.Retmsg, '\\n', '\n');

                // {신청}하시겠습니까?
                MessageBox.confirm(oCheck.Retmsg, {
                  actions: [
                    this.getBundleText('LABEL_00118'), // 취소
                    this.getBundleText('LABEL_00121'), // 신청
                  ],
                  onClose: async (vPress) => {
                    // 신청
                    if (!vPress || vPress !== this.getBundleText('LABEL_00121')) {
                      return;
                    }

                    try {
                      AppUtils.setAppBusy(true);

                      // FileUpload
                      if (!!this.AttachFileAction.getFileCount.call(this)) {
                        await this.AttachFileAction.uploadFile.call(this, sAppno, this.getApprovalType());
                      }

                      oSendObject.Prcty = 'C';

                      const oUrl = await Client.deep(oModel, 'OtWorkApply', oSendObject);

                      if (oUrl.ZappUrl) {
                        window.open(oUrl.ZappUrl, '_blank');
                      }

                      // {신청}되었습니다.
                      MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                        onClose: () => {
                          this.onNavBack();
                        },
                      });
                    } catch (oError) {
                      AppUtils.handleError(oError);
                    }
                  },
                });
              } else {
                // FileUpload
                if (!!this.AttachFileAction.getFileCount.call(this)) {
                  await this.AttachFileAction.uploadFile.call(this, sAppno, this.getApprovalType());
                }

                oSendObject.Prcty = 'C';

                const oUrl = await Client.deep(oModel, 'OtWorkApply', oSendObject);

                if (oUrl.ZappUrl) {
                  window.open(oUrl.ZappUrl, '_blank');
                }

                // {신청}되었습니다.
                MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                  onClose: () => {
                    this.onNavBack();
                  },
                });
              }
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              AppUtils.setAppBusy(false);
            }
          },
        });
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const [aDetailList] = oViewModel.getProperty('/detail/list');
        const sAppno = _.isEmpty(aDetailList) ? '' : aDetailList.Appno;

        this.AttachFileAction.setAttachFile(this, {
          Editable: oViewModel.getProperty('/Fixed'),
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 10,
          // FileTypes: ['jpg', 'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'bmp', 'txt', 'png'],
        });
      },
    });
  }
);
