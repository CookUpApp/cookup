/* eslint-disable no-param-reassign, no-underscore-dangle */
import React, { useContext, useEffect, useState } from 'react';
import _uniqueId from 'lodash/uniqueId';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { faHeart as faHeartSolid, faEdit } from '@fortawesome/free-solid-svg-icons';

// import _ from 'lodash';
import moment from 'moment';
import AppContext from './AppContext';

function Feed() {
  const [feed, setFeed] = useState([]);
  const [inputMap] = useState({});

  const {
    feedFilter,
    setFeedFilter,
    followTags,
    profile,
    setEditRecipe,
    setRecipeVisible,
    setRecipeID,
  } = useContext(AppContext);

  async function fetchRecipes() {
    const {
      user, tags, search, liked,
    } = feedFilter;

    const req = await fetch(`/api/recipe?${user ? `user=${user}` : ''}${liked ? `liked=${liked}` : ''}${(tags || []).length ? `tags=${tags.join()}` : ''}${search ? `search=${search}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const res = await req.json();
    const recipes = res.recipes.map((recipe) => ({ ...recipe, likes: new Set(recipe.likes) }));
    setFeed(recipes || []);
  }

  async function likeRecipe(recipe, indx) {
    const { id } = recipe;

    const req = await fetch('/api/recipe/like',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId: id,
        }),
      });

    const res = await req.json();
    const updated = [...feed];
    updated[indx].likes = new Set(res.likes);
    setFeed(updated);
  }

  async function postComment(recipe) {
    const { id } = recipe;

    const req = await fetch('/api/recipe/comment',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId: id,
          text: inputMap[id],
        }),
      });

    const res = await req.json();
    console.log(res);
  }

  useEffect(() => {
    fetchRecipes();
  }, [feedFilter]);

  return (
    <div>
      { feed.map((recipe, indx) => (
        <div key={_uniqueId()} className="box">
          <article className="media">
            <div className="media-content">
              <small className="is-pulled-right">{moment(recipe.updatedAt).fromNow()}</small>
              <div className="is-flex is-flex-direction-row is-align-items-center">
                <figure className="image is-32x32">
                  <img className="is-rounded" src="https://bulma.io/images/placeholders/128x128.png" alt="pofile" />
                </figure>
                <a href="#" onClick={() => { setFeedFilter({ user: recipe.by.username }); }}>
                  <strong className="username" style={{ marginLeft: '5px' }}>
                    @
                    {recipe.by.username}
                  </strong>
                </a>
              </div>
              <div className="content">
                <p>
                  <br />
                  <strong>{recipe.name}</strong>
                  {' '}
                  <br />
                  {recipe.description}
                  <br />
                  Ingredients:
                  {' '}
                  {recipe.ingredients.join()}
                  <br />
                  Instructions:
                  <br />
                  {recipe.instructions}
                  <br />
                  <div className="field is-grouped is-grouped-multiline">
                    { recipe.tags[0] !== '' && (
                      <div className="practice">
                        { recipe.tags.map((tag) => (
                          <div className="control" key={_uniqueId()}>
                            <div className="tags has-addons">
                              <a href="#" className="tag is-rounded is-link" onClick={() => { setFeedFilter({ tags: [tag] }); }}>{tag}</a>
                              {profile.username ? <a href="#" className="tag is-rounded is-info" onClick={() => { followTags([tag]); }}>+</a> : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </p>
                <div className="field is-grouped is-grouped-multiline">
                  { recipe.tags.map((tag) => (
                    <div className="control" key={_uniqueId()}>
                      <div className="tags has-addons">
                        <a href="#" className="tag is-rounded is-link" onClick={() => { setFeedFilter({ tags: [tag] }); }}>{tag}</a>
                        {(profile.username && !profile.following.includes(tag)) ? <a href="#" className="tag is-rounded is-info" onClick={() => { followTags([tag]); }}>+</a> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <nav className="level is-mobile">
                <div className="level-left">
                  <a
                    href="#"
                    className="level-item"
                    aria-label="like"
                    onClick={() => {
                      likeRecipe(recipe, indx);
                    }}
                  >
                    <span className="icon is-small">
                      <FontAwesomeIcon
                        icon={recipe.likes.has(profile.id) ? faHeartSolid : faHeart}
                      />
                    </span>
                  </a>
                  <p className="level-item"><strong>{recipe.likes.size}</strong></p>
                </div>
                {(profile.username === recipe.by.username) && (
                  <a href="#" onClick={() => { setRecipeID(recipe._id.toString()); setEditRecipe(true); setRecipeVisible(true); }}>
                    <span className="icon is-pulled-right">
                      <FontAwesomeIcon icon={faEdit} />
                    </span>
                  </a>
                )}
              </nav>
              {recipe.comments.map((comment) => (
                <div>
                  <p>
                    <strong>{comment.by.username}</strong>
                    {' '}
                    {comment.text}
                  </p>
                </div>
              ))}
              {profile.username ? (
                <div className="control">
                  <textarea style={{ minHeight: '3em' }} onChange={(event) => { inputMap[recipe.id] = event.target.value; }} className="textarea has-fixed-size" placeholder="Leave a comment..." />
                  <button type="button" className="button is-white is-pulled-right" onClick={() => { postComment(recipe); }}>Send</button>
                </div>
              ) : null}
            </div>
          </article>
        </div>
      )) }
    </div>
  );
}

export default Feed;
