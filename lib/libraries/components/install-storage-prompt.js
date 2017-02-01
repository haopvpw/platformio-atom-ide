/** @babel */

/**
 * Copyright 2016-present Ivan Kravets <me@ikravets.com>
 *
 * This source file is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import * as utils from '../../utils';

import { getCustomStorages, saveCustomStorage } from '../util';
import SelectListView from 'atom-select-list';
import { getPioProjects } from '../../project/util';
import path from 'path';

export default class LibInstallStoragePrompt {

  constructor() {
    this.selectListView = new SelectListView({
      items: this.getItems(),
      infoMessage: 'Install library to',
      filterKeyForItem: (item) => [item.name, item.path].join(' '),
      elementForItem: this.buildSelectListElement,
      didConfirmSelection: (item) => {
        if (item.path === 'custom') {
          atom.pickFolder(paths => {
            if (paths) {
              paths.forEach(p => {
                if (utils.isDir(p)) {
                  this.onDidStorageSelect(p);
                }
              });
              this.destroy();
            }
          });
        } else {
          this.onDidStorageSelect(item.path);
          this.destroy();
        }
      },
      didCancelSelection: () => {
        this.oncancel();
        this.destroy();
      }
    });

    this.promise = new Promise((resolve, reject) => {
      this.onselect = resolve;
      this.oncancel = reject;
    });

    this.panel = null;
  }

  getItems() {
    let items = getPioProjects().map(p => ({
      name: `Project: ${path.basename(p)}`,
      detail: p,
      path: p
    }));
    items = items.concat(getCustomStorages().map(p => ({
      name: `Storage: ${path.basename(p)}`,
      detail: p,
      path: p
    })));
    items.push({
      name: 'Global Library Storage',
      detail: 'Library will be accessible for all your projects',
      path: ''
    });
    items.push({
      name: 'Custom Library Storage',
      detail: 'You can use it later with <kbd>lib_extra_dirs</kbd> option in ' +
              '<kbd>platformio.ini</kbd>. <br>' +
              'Manage them in ' +
              '"PlatformIO IDE Settings > Custom Library Storages"',
      path: 'custom'
    });
    return items;
  }

  buildSelectListElement(item) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    const icon = document.createElement('span');
    icon.classList.add('icon', 'icon-file-directory');
    const project = document.createElement('span');
    project.textContent = item.name;
    span.appendChild(icon);
    span.appendChild(project);
    li.appendChild(span);
    const div = document.createElement('div');
    div.classList.add('text-subtle', 'text-smaller');
    div.innerHTML = item.detail;
    li.appendChild(div);
    return li;
  }

  onDidStorageSelect(path) {
    if (getPioProjects().indexOf(path) === -1) {
      saveCustomStorage(path);
    }
    this.onselect(path);
  }

  prompt() {
    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({
        item: this.selectListView
      });
      this.selectListView.focus();
    }
    return this.promise;
  }

  async destroy() {
    this.panel.hide();
    this.promise = null;
    await this.selectListView.destroy();
  }

}