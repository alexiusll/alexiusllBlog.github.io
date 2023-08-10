/*
 * @Author: linkenzone
 * @Date: 2023-08-10 10:44:51
 * @Descripttion: 来自新版的next
 */

/* global hexo */

'use strict';

const path = require('path');

// Add comment
hexo.extend.filter.register('theme_inject', injects => {
  let theme = hexo.theme.config;
  if (!theme.utterances.enable) return;

  injects.comment.raw('utterances', '<div class="comments" id="utterances-container"></div>', {}, {cache: true});

  injects.bodyEnd.file('utterances', path.join(hexo.theme_dir, 'layout/_third-party/comments/utterances.swig'));

});