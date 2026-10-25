import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import Loader from "../layout/Loader";

const Profile = () => {
  const { user, loading, isAuthenticated } = useSelector((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/users/login");
    }
  }, [loading, isAuthenticated, navigate]);

  return (
    <>
      {loading || !user ? (
        <Loader />
      ) : (
        <>
          <div className="row justify-content-around mt-5 user-info">
            <div className="col-12 col-md-5 profile">
              <div className="d-flex align-items-center mb-4">
                <figure className="avatar avatar-profile text-center mr-3">
                  <img
                    className="rounded-circle figure-img img-fluid"
                    src={user.avatar.url}
                    alt={user.name}
                  />
                </figure>
                <span>Welcome {user.name}!</span>
              </div>
              <Link
                to="/users/me/update"
                id="edit_profile"
                className="btn btn-primary btn-block my-5"
              >
                Edit Profile
              </Link>
              <h4>Full Name:</h4>
              <p>{user.name}</p>

              <h4>Email Address</h4>
              <p>{user.email}</p>

              <h4>Joined On</h4>
              <p>{String(user.createdAt).substring(0, 10)}</p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Profile;
