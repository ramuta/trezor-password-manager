/*
 * Copyright (c) Peter Jensen, SatoshiLabs
 *
 * Licensed under Microsoft Reference Source License (Ms-RSL)
 * see LICENSE.md file for details
 */

'use strict';

var React = require('react'),
    tld = require('tldjs'),
    TableEntry = require('./table_entry/table_entry'),
    FilterInput = require('./filter_input/filter_input'),
    UserMenu = require('./user_menu/user_menu'),
    DropdownButton = require('react-bootstrap').DropdownButton,
    MenuItem = require('react-bootstrap').MenuItem,

    PasswordTable = React.createClass({

        getInitialState() {
            return {
                active_id: 0,
                active_title: '',
                tags: window.myStore.data.tags,
                entries: window.myStore.data.entries,
                filter: '',
                newEntry: false,
                newEntryUrl: '',
                orderType: window.myStore.data.config.orderType || 'note'
            }
        },

        componentWillMount() {
            window.myStore.on('changeTag', this.changeTag);
            window.myStore.on('filter', this.setupFilter);
            window.myStore.on('toggleNewEntry', this.toggleNewEntry);
            window.myStore.on('update', this.updateTableContent);
            chrome.runtime.onMessage.addListener(this.chromeTableMsgHandler);

        },

        componentWillUnmount() {
            window.myStore.removeListener('changeTag', this.changeTag);
            window.myStore.removeListener('filter', this.setupFilter);
            window.myStore.removeListener('toggleNewEntry', this.toggleNewEntry);
            window.myStore.removeListener('update', this.updateTableContent);
            chrome.runtime.onMessage.removeListener(this.chromeTableMsgHandler);
        },

        chromeTableMsgHandler(request, sender, sendResponse) {
            switch (request.type) {
                case 'saveEntry':
                    this.openNewEntry(request.content);
                    sendResponse({type:'entrySaving'});
                    break;
            }
            return true;
        },

        updateTableContent(data) {
            this.setState({
                tags: data.tags,
                entries: data.entries
            });
        },

        setupFilter(filterVal) {
            this.setState({
                filter: filterVal.toLowerCase()
            });
        },

        changeOrder(newOrderType) {
            window.myStore.changedOrder(newOrderType);
            this.setState({
                orderType: newOrderType
            });
        },

        getProperOrderArr() {
            var rawArr = Object.keys(this.state.entries);
            if (rawArr.length > 0) {
                if (this.state.orderType === 'date') {
                    return rawArr.reverse();
                } else {
                    let tempArray = Object.keys(this.state.entries).map((key) => {
                        let pattern = this.state.entries[key].note.length > 0 ? this.state.entries[key].note : this.state.entries[key].title;
                        if (this.isUrl(pattern)) {
                            pattern = this.removeProtocolPrefix(pattern);
                        }
                        return {
                            'key': key,
                            'pattern': pattern
                        }
                    }).sort((a, b) => {
                        return a.pattern.localeCompare(b.pattern);
                    });
                    return Object.keys(tempArray).map((obj) => {
                        return tempArray[obj].key
                    });
                }
            } else {
                return false;
            }
        },

        changeTag(e) {
            if (e === undefined) {
                this.setState({
                    active_id: parseInt(this.state.active_id),
                    active_title: this.state.active_title
                });
            } else {
                this.setState({
                    active_id: parseInt(e),
                    active_title: window.myStore.getTagTitleById(e)
                });
            }
        },

        removeProtocolPrefix(url) {
            return url.indexOf('://') > -1 ? url.substring(url.indexOf('://') + 3, url.length).split('/')[0] : url.split('/')[0];
        },

        isUrl(url){
            return url.match(/[a-z]+\.[a-z][a-z]+(\/.*)?$/i) != null
        },

        checkFilterMatching(obj) {
            let filterArr = this.state.filter.match(/[^ ]+/g);
            let filterMatch = 0;
            filterArr.map((term) => {
                let tempVal = false;
                window.myStore.getTagTitleArrayById(obj.tags).map((key) => {
                    if (key.toLowerCase().indexOf(term) > -1) tempVal = true;
                });
                if (obj.title.toLowerCase().indexOf(term) > -1 ||
                    obj.note.toLowerCase().indexOf(term) > -1 ||
                    obj.username.toLowerCase().indexOf(term) > -1) {
                    tempVal = true;
                }
                filterMatch += tempVal;
            });
            return filterMatch >= filterArr.length;
        },

        activeTag(obj) {
            return obj.tags.indexOf(this.state.active_id) > -1 || this.state.active_id === 0;
        },

        filterIsSet() {
            return this.state.filter.length > 0;
        },

        openNewEntry(url) {
            this.setState({
                newEntryUrl: url,
                newEntry: true
            });
        },

        toggleNewEntry() {
            this.setState({
                newEntryUrl: '',
                newEntry: !this.state.newEntry
            });
        },

        render(){
            let raw_table = this.getProperOrderArr(),
                count = !!raw_table.length ? 0 : 1,
                newTagArr = this.state.active_id === 0 ? [] : [this.state.active_id],
                password_table = !!raw_table.length ? raw_table.map((key) => {
                    let obj = this.state.entries[key];
                    let actTag = this.activeTag(obj);
                    if (actTag) {
                        if (this.filterIsSet()) {
                            if (this.checkFilterMatching(obj)) {
                                count++;
                                return (
                                    <TableEntry key={key}
                                                key_value={key}
                                                title={obj.title}
                                                username={obj.username}
                                                password={obj.password}
                                                nonce={obj.nonce}
                                                tags={obj.tags}
                                                safe_note={obj.safe_note}
                                                note={obj.note}
                                        />
                                )
                            }
                        } else {
                            count++;
                            return (
                                <TableEntry key={key}
                                            key_value={key}
                                            title={obj.title}
                                            username={obj.username}
                                            password={obj.password}
                                            nonce={obj.nonce}
                                            tags={obj.tags}
                                            safe_note={obj.safe_note}
                                            note={obj.note}
                                    />
                            )
                        }
                    }
                }) : (<div className='no-entries'><img src='dist/app-images/nopwd.svg' alt='no passwords'/><div className='headline'>Add your first password.</div><div>Click to “Add entry” or use “Import”</div></div>);
            return (
                <div className='wraper container-fluid'>
                    <div className='row page-title'>
                        <div className='col-sm-8 col-xs-9'>
                            <button type='button'
                                    onClick={this.toggleNewEntry}
                                    disabled={this.state.newEntry}
                                    className='blue-btn add'>Add entry
                            </button>
                            <FilterInput eventEmitter={this.props.eventEmitter}/>
                        </div>
                        <div className="col-sm-4 col-xs-3 text-right">
                            <DropdownButton title='Sort' className='dropdown order' noCaret pullRight
                                            id='order-dropdown-no-caret'>
                                <MenuItem active={this.state.orderType === 'note'}
                                          onSelect={this.changeOrder.bind(null, 'note')}><i
                                    className='ion-ios-list-outline'></i>Title</MenuItem>
                                <MenuItem active={this.state.orderType === 'date'}
                                          onSelect={this.changeOrder.bind(null, 'date')}><i
                                    className='ion-calendar'></i>Date</MenuItem>
                            </DropdownButton>
                            <UserMenu />
                        </div>
                    </div>
                    <div className='row dashboard'>
                        {this.state.newEntry &&
                        <TableEntry key={undefined}
                                    key_value={undefined}
                                    title={this.state.newEntryUrl}
                                    username=''
                                    password=''
                                    tags={newTagArr}
                                    note={this.state.newEntryUrl.length ? tld.getDomain(this.state.newEntryUrl) : ''}
                                    nonce=''
                                    safe_note=''
                                    mode={'edit-mode'}
                                    content_changed={'edited'}
                            />}
                        {count !== 0 ? password_table : (<div className='no-entries'><img src='dist/app-images/nosearch.svg' alt='no passwords'/><div className='headline'>No results.</div><div>Consider your criteria.</div></div>)}
                    </div>
                </div>
            )
        }
    });

module.exports = PasswordTable;
