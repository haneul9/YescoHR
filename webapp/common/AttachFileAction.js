/* eslint-disable quote-props */
sap.ui.define(
    [
      'sap/m/MessageBox',
      'sap/ui/yesco/common/odata/ServiceManager',
      'sap/ui/yesco/common/odata/ServiceNames',
    ],
    (
        MessageBox,
        ServiceManager,
        ServiceNames,
    ) => {
        'use strict';

        return {
            /*
            * 첨부파일의 Upload가 완료되었을때 처리 내역
            * refreshAttachFileList Function을 호출한다.
            */
            uploadComplete(oEvent) {
                const sResponse = oEvent.getParameter("response");
                // const oFileUploader = oController.byId([this.PAGEID, "ATTACHFILE_BTN"].join(this.SEQ || "_"));

                sap.m.MessageBox.alert(sResponse, { title: "안내" });

                // oFileUploader.setValue("");

                // common.AttachFileAction.refreshAttachFileList(this);
            },

            /*
            * Upload할 첨부파일을 선택했을 경우 처리 내역
            */
            onFileChange(oEvent) {
                const oAttachbox = this.byId("ATTACHBOX");
                const oFileUploader = this.byId("ATTACHFILE_BTN");
                // const f1 = document.getElementById("ATTACHFILE_BTN-fu_input-inner");
                const JSonModel = oAttachbox.getModel();
                const aFileList = [];
                const vMode = JSonModel.getProperty("/Settings/Mode");
                const vMax = JSonModel.getProperty("/Settings/Max");
                const files = oEvent.getParameters().files;
                let vFileData = JSonModel.getProperty("/Data");

                // File 데이터 초기화
                if(!vFileData) {
                    JSonModel.setProperty("/Data", []);
                    vFileData = JSonModel.getProperty("/Data");
                }

                if (!!files) {
                    vFileData.forEach(function(elem) {
                        aFileList.push(elem);
                    });

                    if(vMode === "M" && (vFileData.length + files.length) > vMax) {
                        oFileUploader.clear();
                        oFileUploader.setValue("");
                        // if (f1) f1.setAttribute("value", "");

                        sap.m.MessageToast.show(this.getBundleText("MSG_00036").interpolate(vMax), { my: "center center", at: "center center"});

                        return;
                    }

                    const iFileLeng = aFileList.length + 1;

                    for (let i = 0; i < files.length; i++) {
                        files[i].New = true;
                        files[i].Zfilename = files[i].name;
                        files[i].Type = files[i].type;
                        files[i].Zbinkey = String(parseInt(Math.random() * 100000000000000));
                        files[i].Seqnr = iFileLeng;

                        aFileList.push(files[i]);
                    }

                    JSonModel.setProperty("/Settings/Length", iFileLeng);
                    JSonModel.setProperty("/Data", aFileList);

                    this.byId("attachTable").setVisibleRowCount(iFileLeng);
                }

                oFileUploader.clear();
                oFileUploader.setValue("");
                // if (f1) f1.setAttribute("value", "");

                // if(typeof AttachFileAction.fnChange === "function") AttachFileAction.fnChange.call(this);
            },

            /*
            * 첨부파일 링크 Click
            */
            onFileLink(oEvent) {
                var vFileInfo = oEvent.getSource().getBindingContext().getProperty();

                if(!vFileInfo) return;

                window.open(vFileInfo.Url, '_blank');
            },

            /*
            * 첨부파일 리스트를 Binding한다.
            */
            refreshAttachFileList(vAppno = '', vType) {
                // const f1 = document.getElementById("ATTACHFILE_BTN-fu_input-inner");
                const oAttachbox = this.byId("ATTACHBOX");
                const oAttachFileList = this.byId("attachTable");
                const oFileUploader = this.byId("ATTACHFILE_BTN");
                const oModel = this.getModel(ServiceNames.COMMON);
                const JSonModel = this.getViewModel();
                const vAttachFileDatas = JSonModel.getProperty("/Data");
                const Datas = { Data: [] };

                // JSonModel.setProperty("/Settings/Length", 0);
                JSonModel.setProperty("/Data", []);

                // if(!vAppnm) {
                //     if(typeof common.AttachFileAction.fnRetrieveCallback === "function") common.AttachFileAction.fnRetrieveCallback.call(this);
                //     return;
                // }

                oAttachbox.setBusyIndicatorDelay(0).setBusy(true);

                // if (f1) f1.setAttribute("value", "");

                oFileUploader.clear();
                oFileUploader.setValue("");
                // oAttachFileList.removeSelections(true);

                oModel.read("/FileListSet", {
                    async: false,
                    filters: [
                        new sap.ui.model.Filter("Appno", sap.ui.model.FilterOperator.EQ, vAppno),
                        new sap.ui.model.Filter("Zworktyp", sap.ui.model.FilterOperator.EQ, vType)
                    ],
                    success: function (data) {
                        if (data && data.results.length) {
                            data.results.forEach(function (elem) {
                                elem.New = false;
                                // elem.Type = elem.Zfilename.substring(elem.Zfilename.lastIndexOf(".") + 1);
                                elem.Url = elem.Fileuri.replace(/retriveScpAttach/, "retriveAttach");
                                // elem.Mresource_convert = "data:${mimetype};base64,${resource}".interpolate(elem.Mimetype, elem.Mresource);

                                Datas.Data.push(elem);
                            });
                        }

                        // DB저장 전 올린 File List 를 배열에 담는다. ( 이후에 DB에 저장 된 File List 와 결합하여 보여줌 )
                        // if (vExistDataFlag == "X" && vAttachFileDatas) {
                        //     vAttachFileDatas.forEach(function (elem) {
                        //         if(elem.New === true) Datas.Data.push(elem);
                        //     });
                        // }

                        JSonModel.setProperty("/Settings/Length", Datas.Data.length);
                        JSonModel.setProperty("/Data", Datas.Data);
                        oAttachFileList.setVisibleRowCount(Datas.Data.length);

                        oAttachbox.setBusy(false);
                        // if(typeof common.AttachFileAction.fnRetrieveCallback === "function") common.AttachFileAction.fnRetrieveCallback.call(this);
                    },
                    error: function (res) {
                        // common.Common.log(res);
                        oAttachbox.setBusy(false);
                        // if(typeof common.AttachFileAction.fnRetrieveCallback === "function") common.AttachFileAction.fnRetrieveCallback.call(this);
                    }
                })
            },

            /*
            *   첨부파일 Upload
            */
            uploadFile(Appno, Type) {
                // const oModel = this.getModel(ServiceNames.COMMON);
                const oController = this;
                const sServiceUrl = ServiceManager.getServiceUrl('ZHR_COMMON_SRV', this.getOwnerComponent());
                const oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true, undefined, undefined, undefined, undefined, undefined, false);
                const Attachbox = this.byId("ATTACHBOX");
                const vAttachDatas = Attachbox.getModel().getProperty("/Data") || [];
                const aDeleteFiles = Attachbox.getModel().getProperty("/DelelteDatas") || [];
        
                try {
                    const _handleSuccess = function (data) {                        
                        console.log("파일 업로드를 완료하였습니다." + ", " + data);
                    };
                    const _handleError = function (data) {
                        const errorMsg = "파일 업로드에 실패하였습니다.";
        
                        console.log("Error: " + data);
                        sap.m.MessageToast.show(errorMsg, { my: "center center", at: "center center"});
                    };
        
                    // 파일 삭제
                    if(!!aDeleteFiles.length) {
                        let bDeleteFlag = true;

                        aDeleteFiles.some(function(elem) {
                            bDeleteFlag = oController.AttachFileAction.callDeleteFileService(oController, elem);
                        });
        
                        setTimeout(() => {
                            if(!bDeleteFlag) {
                                sap.m.MessageToast.show("파일 업로드에 실패하였습니다.", { my: "center center", at: "center center"});
                                return;
                            }
                        }, 1000);
                    }
        
                    // 신규 등록된 파일만 업로드
                    if (vAttachDatas.every(e => !e.New)) return;
        
                    vAttachDatas.forEach(function (elem) {
                        if(elem.New === true) {
                            oModel.refreshSecurityToken();
                            const oRequest = oModel._createRequest();
                            const oHeaders = {
                                "x-csrf-token": oRequest.headers["x-csrf-token"],
                                "slug": [Appno, Type, encodeURI(elem.Zfilename)].join("|")
                            };
            
                            // common.Common.log(oHeaders.slug);
                            
                            jQuery.ajax({
                                type: "POST",
                                async: false,
                                url: sServiceUrl + "/FileUploadSet/",
                                headers: oHeaders,
                                cache: false,
                                contentType: elem.type,
                                processData: false,
                                data: elem,
                                success: _handleSuccess.bind(this),
                                error: _handleError.bind(this)
                            });
                        }
                    }.bind(this));
                } catch (oException) {
                    jQuery.sap.log.error("File upload failed:\n" + oException.message);
                }
            },

            /*
            * 첨부된 파일을 삭제처리
            */
            onDeleteAttachFile: function () {
                const oController = this;
                const oAttachbox = this.byId("ATTACHBOX");
                const oJSonModel = oAttachbox.getModel();
                const oTable = this.byId("attachTable");
                const aFileDatas = oJSonModel.getProperty("/Data");
                const aContexts = oTable.getSelectedIndices();

                if (!aContexts.length) {
                    sap.m.MessageBox.alert("삭제할 파일을 선택하세요."); // 삭제할 파일을 선택하세요.
                    return;
                }

                // oTable.removeSelections(true);

                var deleteProcess = function (fVal) {
                    if(fVal === sap.m.MessageBox.Action.YES) {   
                        const aSelectFiles = [];

                        aContexts.forEach(e => {
                            aSelectFiles.push(aFileDatas[e]);
                        });

                        const aResult = aFileDatas.filter(e => {
                            return !aSelectFiles.includes(e);
                        });

                        oJSonModel.setProperty("/Data", aResult);
                        oJSonModel.setProperty("/DelelteDatas", aSelectFiles);
                        oTable.setVisibleRowCount(aResult.length);
                        sap.m.MessageToast.show("파일 삭제가 완료되었습니다.", { my: "center center", at: "center center"}); // 파일 삭제가 완료되었습니다.
                    }
                };

                sap.m.MessageBox.show("선택한 파일을 삭제하시겠습니까?", {
                    title: "확인",
                    actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                    onClose: deleteProcess
                });
            },

            /*
            * 첨부파일 삭제 oData
            */
            callDeleteFileService: function(oController, fileInfo) {
                const oModel = oController.getModel(ServiceNames.COMMON);
                const sPath = oModel.createKey("/FileListSet", {
                    Appno: fileInfo.Appno,
                    Zworktyp: fileInfo.Zworktyp,
                    Zfileseq: fileInfo.Zfileseq,
                });
        
                oModel.remove(sPath, {
                    async: false,
                    success: function () {
                        return true;
                    },
                    error: function (res) {
                        const errData = common.Common.parseError(res);
                        
                        if(errData.Error && errData.Error === "E") {
                            sap.m.MessageBox.error(errData.ErrorMessage, {
                                title: oController.getBundleText("확인")
                            });
                        }
                        return false;
                    }
                });
            },

            // 임시저장
            // uploadTemporaryFile(vBinkey, Type) {
            //     const sServiceUrl = ServiceManager.getServiceUrl('ZHR_COMMON_SRV', this.getOwnerComponent());
            //     const oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true, undefined, undefined, undefined, undefined, undefined, false);
            //     const Attachbox = this.byId("ATTACHBOX");
            //     const vAttachDatas = Attachbox.getModel().getProperty("/Data") || [];
        
            //     try {
            //         const _handleSuccess = function (data) {                        
            //             // common.Common.log("파일 업로드를 완료하였습니다." + ", " + data);
            //         };
            //         const _handleError = function (data) {
            //             const errorMsg = "파일 업로드에 실패하였습니다.";
        
            //             // common.Common.log("Error: " + data);
            //             sap.m.MessageToast.show(errorMsg, { my: "center center", at: "center center"});
            //         };
        
            //         // 신규 등록된 파일만 업로드
            //         if (!vAttachDatas) return;
        
            //         vAttachDatas.forEach(function (elem) {
            //             if(elem.New === true) {
            //                 oModel.refreshSecurityToken();
            //                 const oRequest = oModel._createRequest();
            //                 const oHeaders = {
            //                     "x-csrf-token": oRequest.headers["x-csrf-token"],
            //                     "slug": [vBinkey, Type, encodeURI(elem.Zfilename)].join("|")
            //                 };
            
            //                 // common.Common.log(oHeaders.slug);
                            
            //                 jQuery.ajax({
            //                     type: "POST",
            //                     async: false,
            //                     url: "/proxy/sap/opu/odata/sap/ZHR_BENEFIT_SRV/BinaryFileTabSet/",
            //                     headers: oHeaders,
            //                     cache: false,
            //                     contentType: elem.type,
            //                     processData: false,
            //                     data: elem,
            //                     success: _handleSuccess.bind(this),
            //                     error: _handleError.bind(this)
            //                 });
            //             }
            //         }.bind(this));
            //     } catch (oException) {
            //         jQuery.sap.log.error("File upload failed:\n" + oException.message);
            //     }
            // }
        }
    }
);