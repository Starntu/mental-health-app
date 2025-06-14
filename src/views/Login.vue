<template>
    <div class="login-container">
        <form id="login-form">
            <h2>Login</h2>
            <div class="input-group">
                <label for="username">Username</label>
                <input type="text" id="username" name="username" placeholder="Enter your username" required>
            </div>
            <div class="input-group">
                <label>
                    Password
                    <input type="password" id="password" name="password" placeholder="Enter your password" required>
                </label>
            </div>
            <button type="submit">Login</button>
            <label>
                Remember me
                <input type="checkbox" id="remember me" name="remember me" value="Remember me">
            </label>
        </form>
    </div>
</template>